# VisScan - DevSecOps Scanning Platform

## Overview

VisScan เป็นแพลตฟอร์มสำหรับจัดการการสแกนความปลอดภัยของ Code (Code Scanning) ที่เน้นการจัดการ Workflow ระหว่าง Developer และ Admin ในการทำงานร่วมกับระบบความปลอดภัย

## Objective

- เพิ่ม security layer ให้กระบวนการพัฒนาซอฟต์แวร์
- ตรวจสอบ code & image ก่อน Deploy
- สามารถ Tracking & Monitoring โดย Admin

## Tech Stack Details

- **Frontend:** Next.js 16 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide React Icons
- **Authentication:** NextAuth.js v4 with Credentials / Google OAuth
- **Database:** PostgreSQL 15
- **ORM:** Prisma 6
- **Message Queue:** RabbitMQ 3
- **API:** RESTful APIs with Next.js API Routes / tRPC
- **Real-time Updates:** SWR for data fetching
- **Security:** bcryptjs for encryption, JWT for sessions

---

## Setup & Installation (การตั้งค่าแบบ Local)

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
เริ่มต้น PostgreSQL และ RabbitMQ ด้วย Docker Compose:
```bash
docker compose -f docker-compose.db.yml up -d
```

### 3. Environment Configuration
สร้างไฟล์ `.env` ที่ตำแหน่ง Root และตั้งค่าตามตัวอย่าง `.env.example`:
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (สร้างด้วย: `openssl rand -base64 32`)

### 4. Database Schema Setup
```bash
# สร้าง Prisma Client
npx prisma generate

# Push schema ไปยัง database
npx prisma db push
```

### 5. Start Development Servers

**Terminal 1 - Web Application:**
```bash
npm run dev
```

**Terminal 2 - Background Worker:**
```bash
npm run worker:dev
```

---

## Production Deployment ( Docker Compose)

ใช้คำสั่งเพื่อทำการบิวด์และรันระบบทั้งหมด:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

> **Superadmin Setup**: 
```bash
docker compose -f docker-compose.prod.yml logs worker
```


---

## Features (ฟังก์ชันการทำงานหลัก)

### 1. Identity & Access Management (IAM)
-  ระบบเข้าสู่ระบบความปลอดภัย
-  **User Approval Flow:** แอดมินตรวจสอบเพื่ออนุมัติสิทธิ์เข้าใช้งาน
- **Role-Based Access Control:** สลับสิทธิ์แอดมินหรือผู้ใช้ทั่วไปได้ชัดเจน

### 2. Scanning Workflow
-  สแกนสถิติหรือสแกนคอนเทนเนอร์ (Gitleaks, Semgrep, Trivy)
-  จัดกลุ่มจัดลำดับการสเตททำงาน CI/CD
-  ฟลิตเตอร์เปรียบเทียบผลลัพธ์ Scan Results ในอดีตได้

-- 
ทีมพัฒนา:
- Ronnachai (Backend)
- Kittiwat (Frontend)