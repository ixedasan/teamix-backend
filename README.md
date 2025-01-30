<div align="center">

# 💌 Teamix Backend 💌

[![Frontend](https://img.shields.io/badge/Open-Frontend_App-22C55E?style=for-the-badge&logo=netlify&logoColor=white)](https://github.com/ixedasan/teamix-frontend.git)

</div>

## Features

- 🔐 User authentication and authorization
- 👥 Project management with roles
- ✅ Task management with status tracking
- 🏷️ Task labeling and categorization
- 📎 File attachments support
- 💬 Comments on tasks
- 📑 Project documentation
- 🔔 Notification system
- 📱 Telegram bot integration
- 💳 Subscription plans

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **API**: GraphQL
- **Caching**: Redis
- **Storage**: S3-compatible storage
- **Authentication**: Session-based with cookies
- **Real-time**: WebSocket support
- **Email**: SMTP integration
- **Bot**: Telegram Bot API

## Prerequisites

- Node.js (Latest LTS version)
- PNPM package manager
- Docker and Docker Compose
- S3-compatible storage
- SMTP server for emails
- Telegram Bot Token

## Getting Started

To clone and run this application, you'll need [Git](https://git-scm.com/), [PNPM](https://pnpm.io/) and [Docker](https://www.docker.com/) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/ixedasan/teamix-backend.git

# Navigate to the project directory
$ cd teamix-backend

# Install dependencies
$ pnpm install

# Set up environment variables
$ cp .env.example .env

# Start the Docker containers
$ docker-compose up -d

# Push database schema
$ pnpm db:push

# Start the development server
$ pnpm start:dev
```

## Contribution

Contributions are welcome! Please feel free to submit a pull request or open an issue for discussion.
