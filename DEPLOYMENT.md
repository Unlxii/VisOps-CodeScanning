# คู่มือการติดตั้งและใช้งาน (Deployment Guide) - CMU VisScan

เอกสารนี้จะอธิบายขั้นตอนการย้ายโค้ดจากเครื่อง Mac ไปยัง Production VM (`10.10.184.118`) และตั้งค่าให้ทำงานร่วมกับ GitLab ที่มีอยู่เดิม

##  ข้อสำคัญ: การจัดการ Port ชนกัน
เครื่อง VM นี้มีการใช้งาน GitLab อยู่แล้วที่พอร์ต 80/443 การที่จะให้ VisScan ใช้พอร์ตเหล่านี้ได้ จำเป็นต้องย้าย GitLab ไปใช้พอร์ตอื่นก่อน (เช่น `8929`)

## 0. การย้ายโค้ดไปที่เครื่อง VM (Transfer Code)
เนื่องจากโปรเจกต์ยังอยู่ที่เครื่อง Mac เรามี 2 วิธีในการนำโค้ดไปวางบน VM:

### วิธีที่ 1: ผ่าน Git (แนะนำ)
หากคุณ push โค้ดขึ้น Git Repository (เช่น GitHub หรือ GitLab ส่วนตัว) แล้ว:
1. SSH เข้าไปที่ VM:
   ```bash
   ssh <username>@10.10.184.118
   ```
2. Clone โปรเจกต์ลงมา:
   ```bash
   git clone -b <branch-name> <your-repo-url> viscan-app
   cd viscan-app
   # หรือถ้า clone มาแล้ว อยากเปลี่ยน branch:
   # git checkout <branch-name>
   ```

### วิธีที่ 2: ก๊อปปี้ไฟล์ตรงๆ (SCP)
หากต้องการส่งไฟล์จากเครื่อง Mac ไปที่ VM โดยตรง (ไม่ต้องผ่าน Git):
1. **บนเครื่อง Mac** รันคำสั่งนี้ที่ terminal (อยู่ในโฟลเดอร์โปรเจกต์):
   ```bash
   # ส่งทั้งโฟลเดอร์ไปที่ home directory ของ user บน VM
   # ยกเว้น node_modules และ .git เพื่อความเร็ว
   rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' ./ <username>@10.10.184.118:~/viscan-app
   ```

---

## 1. การตั้งค่า GitLab ใหม่ (ย้ายไป Port 8929)
ก่อนจะรัน VisScan ต้องย้าย GitLab หนีจากพอร์ต 80/443 ก่อน

1.  **SSH เข้าไปที่เครื่อง VM** และแก้ไขไฟล์ Config:
    ```bash
    sudo nano /etc/gitlab/gitlab.rb
    ```

2.  **ค้นหาหรือเพิ่มค่าเหล่านี้** (กด `Ctrl+W` เพื่อค้นหา หรือเลื่อนไปล่างสุดไฟล์แล้วเพิ่มเข้าไปเลย):
    ```ruby
    # 1. เปลี่ยน External URL ให้มีพอร์ต
    external_url 'http://10.10.184.118:8929' 

    # 2. บังคับ Nginx ของ GitLab ให้ฟังที่พอร์ต 8929
    # (ถ้าหาบรรทัดนี้ไม่เจอ ให้พิมพ์เพิ่มเข้าไปใหม่ได้เลย)
    nginx['listen_port'] = 8929
    ```

3.  **สั่ง Reconfigure GitLab**:
    ```bash
    sudo gitlab-ctl reconfigure
    ```

4.  **ตรวจสอบ**: ลองเข้า `http://10.10.184.118:8929` ดูว่ายังใช้งานได้ไหม

---

## 2. การ Deploy VisScan (ที่ Port 80/443)

### การตั้งค่า Environment
SSH เข้าไปที่โฟลเดอร์ `viscan-app` บน VM แล้วสร้างไฟล์ `.env`:
```bash
cd ~/viscan-app
nano .env
```
วางค่าตามตัวอย่าง:
```env
NEXT_PUBLIC_BASE_URL=https://viscan.cpe.eng.cmu.ac.th

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/scandb?schema=public"

# GitLab Config
GITLAB_PROJECT_ID=141
GITLAB_TOKEN="<glpat-token>" 
GITLAB_API_URL="http://10.10.184.118:8929/api/v4"
GITLAB_TRIGGER_TOKEN="<glptt-token>"
TEMPLATE_API_KEY="secret-key-for-internal-use"
ENCRYPTION_KEY="<32-chars-key>"

# CMU EntraID Auth (Standardized)

CMU_ENTRAID_REDIRECT_URL="https://viscan.cpe.eng.cmu.ac.th/cmuEntraIDCallback"
CMU_ENTRAID_AUTHORIZATION_URL="https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/authorize"
CMU_ENTRAID_GET_TOKEN_URL="https://login.microsoftonline.com/cf81f1df-de59-4c29-91da-a2dfd04aa751/oauth2/v2.0/token"
CMU_ENTRAID_GET_BASIC_INFO="https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo"
SCOPE="api://cmu/Mis.Account.Read.Me.Basicinfo offline_access"

# IMPORTANT: ต้องใช้ Domain เท่านั้น (IP ใช้ไม่ได้ เพราะ CMU ไม่อนุญาต)
NEXTAUTH_URL="https://viscan.cpe.eng.cmu.ac.th"
NEXTAUTH_SECRET="<generate-random-secret>"

# RabbitMQ
RABBITMQ_URL="amqp://localhost:5672"
```

### ไฟล์ Docker Compose (`docker-compose.prod.yml`)
สร้างไฟล์ `docker-compose.prod.yml` (หรือแก้ไขไฟล์เดิม):
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "80:3000"  # ยิงพอร์ต 80 เข้า 3000
    env_file: .env
    depends_on:
      - db
      - rabbitmq
    restart: always

  worker:
    build: 
      context: .
      dockerfile: Dockerfile.worker
    env_file: .env
    depends_on:
      - db
      - rabbitmq
    restart: always

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: scandb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  postgres_data:
```

### สั่งเริ่มระบบ
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### การเปิด Firewall (ถ้ามี UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8929/tcp
sudo ufw allow 5432/tcp
sudo ufw allow 5672/tcp
sudo ufw allow 15672/tcp
```

## 3. การตรวจสอบ (Verify)
- **GitLab**: `http://10.10.184.118:8929`

---

---

## 3. การแก้ปัญหา "Job Stuck" (Troubleshooting)

หากเคยใช้งานได้ปกติ แต่ตอนนี้ **Pipeline ค้าง (Stuck)**:

### 3.1 ตรวจสอบ Runner เดิมก่อน (Check Existing Runner)
ลอง SSH เข้าไปที่ VM แล้วเช็คว่า container ของ runner ยังทำงานอยู่ไหม:

```bash
# 1. ดู Container ที่รันอยู่
docker ps | grep gitlab-runner

# 2. ถ้าไม่เจอ ให้ลองดู Container ทั้งหมด (รวมที่หยุดไปแล้ว)
docker ps -a | grep gitlab-runner

# 3. ถ้าเจอแต่ State เป็น Exited ให้ลอง Start ใหม่
docker start gitlab-runner
```

ถ้า **ไม่เจอ Runner เลย** หรือ **Start แล้วยังไม่ได้ผล** ให้ทำตามขั้นตอนการติดตั้งใหม่ด้านล่าง (3.2)

---

### 3.2 ติดตั้ง Runner ใหม่ (Setup New Runner)
หากไม่มี Runner หรือกู้คืนไม่ได้ ให้สร้างใหม่ตามขั้นตอนนี้:

1.  **ไปที่ GitLab Web Interface**:
    - Project -> Settings -> CI/CD -> Runners
    - ก๊อปปี้ **Registration Token** เก็บไว้

2.  **อัปเดตไฟล์บน VM (สำคัญ!)**:
    - เนื่องจากไฟล์ `docker-compose.runner.yml` และ `scripts/register-runner.sh` เพิ่งสร้างใหม่ในเครื่องคุณ
    - ต้องอัปโหลดไฟล์เหล่านี้ไปที่ VM ก่อน:
    ```bash
    # รันคำสั่งนี้บนเครื่อง Mac ของคุณ (เปลี่ยน <username> เป็นชื่อ user บน VM)
    rsync -avz ./docker-compose.runner.yml ./scripts <username>@10.10.184.118:~/viscan-app/
    ```

3.  **รันคำสั่งลงทะเบียน Runner (บน VM)**:
    - SSH เข้าไปที่ VM: `ssh <username>@10.10.184.118`
    - เข้าไปที่โฟลเดอร์โปรเจกต์: `cd ~/viscan-app`
    ```bash
    # ให้สิทธิ์ execute ไฟล์
    chmod +x scripts/register-runner.sh
    
    # รันสคริปต์
    ./scripts/register-runner.sh
    ```
    - เมื่อถาม **GitLab URL**: ให้ใช้ค่า default (`http://10.10.184.118:8929`) หรือกด Enter
    - เมื่อถาม **Token**: ให้วาง Token ที่ได้จากข้อ 1

4.  **รัน Service Runner**:
    ```bash
    docker-compose -f docker-compose.runner.yml up -d
    ```

5.  **ตรวจสอบสถานะ**:
    - กลับไปหน้า Settings -> CI/CD -> Runners ใน GitLab
    - จะต้องเห็นจุดสีเขียว (� Online)
    - ไปที่ Pipeline ที่ค้างอยู่ กด **Cancel** แล้ว **Run Pipeline** ใหม่
