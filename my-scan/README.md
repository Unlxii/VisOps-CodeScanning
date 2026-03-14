# VisScan: Automated Code and Container Security Scanning

VisScan is a comprehensive security tool designed to automate static analysis and container vulnerability scanning. It integrates with GitLab CI/CD to provide real-time security insights for your projects.

## Features

- **Static Analysis**: Detects secrets, hardcoded credentials, and common code vulnerabilities early in the dev cycle.
- **Container Scanning**: Scans Docker images for known vulnerabilities using industry-standard tools like Trivy.
- **Real-time Monitoring**: Track scan progress and view detailed findings directly in a dedicated dashboard.
- **Role-Based Access Control**: Secure management with Superadmin, Admin, and User roles.
- **Historical Reports**: Maintain a searchable history of security scans for audit and compliance.

## Prerequisites

- **Environment**: Node.js (v18 or later)
- **Database**: PostgreSQL (v12+)
- **Queue**: RabbitMQ
- **Runtime**: Docker (for container builds and scans)
- **Integration**: GitLab Account (for CI/CD pipeline triggering)

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Unlxii/VisScan.git
   cd VisScan/my-scan
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and update your secrets.
   ```bash
   cp .env.example .env
   ```

4. **Initialize Database**:
   ```bash
   npx prisma migrate dev
   ```

5. **Run the application**:
   ```bash
   # Start the web server
   npm run dev

   # Start the background worker
   npm run worker
   ```

## Architecture

VisScan follows a modern micro-workflow architecture:
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS.
- **API Server**: Type-safe tRPC for robust data fetching.
- **Task Worker**: Distributed RabbitMQ workers for reliable pipeline triggering.
- **Security Engine**: Automated GitLab CI runners executing Gitleaks, Semgrep, and Trivy.

## Contributing

Contributions make the open-source community an amazing place! Please check our guidelines.

## License

Distributed under the MIT License. See LICENSE for more information.

---
Built for secure development.
