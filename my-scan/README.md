# VisScan: Automated Code and Container Security Scanning

VisScan is a comprehensive security tool designed to automate static analysis and container vulnerability scanning. It integrates with GitLab CI/CD to provide real-time security insights for your projects.

## Features

- **Static Analysis**: Detects secrets, hardcoded credentials, and common code vulnerabilities.
- **Container Scanning**: Scans Docker images for known vulnerabilities using Trivy.
- **Real-time Monitoring**: Track scan progress and view detailed findings directly in the dashboard.
- **Role-Based Access Control**: Secure access with Superadmin, Admin, and User roles.
- **Historical Reports**: Maintain a history of security scans for audit and compliance.

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL
- RabbitMQ
- Docker (for container builds and scans)
- GitLab Account (for CI/CD integration)

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
   Copy `.env.example` to `.env` and fill in your configuration.
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

   # Start the worker
   npm run worker
   ```

## Architecture

VisScan uses a distributed architecture:
- **Web Frontend**: Built with Next.js and Tailwind CSS.
- **API Server**: tRPC-based server for efficient communication.
- **Task Worker**: RabbitMQ-driven worker for triggering GitLab pipelines.
- **Security Engine**: GitLab CI runners executing Gitleaks, Semgrep, and Trivy.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## License

This project is licensed under the MIT License.
