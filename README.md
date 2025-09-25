Got it 👍 I’ll update your **README.md** so it includes both **Docker setup** and **manual (without Docker) setup**, along with the extra **features section** you mentioned.

Here’s the revised README:

```markdown
# 📱 Social Media Application

A full-stack **social media application** built with a **NestJS backend**, **Next.js frontend**, and a **PostgreSQL database**.  
Supports **user authentication, profiles, posts, comments, and reactions** with a **responsive UI** and **real-time updates**.

---

## ✨ Features

- 🔐 **User Authentication**: Register, login, logout with JWT-based authentication.
- 👤 **Profile Management**: Update name, bio, avatar with post/comment/reaction counts.
- 📝 **Posts**: Create, view, comment, and react to posts with images.
- 💬 **Nested Comments**: Reply to comments in a thread-like structure.
- 🎭 **Multiple Reactions**: Like 👍, love ❤️, laugh 😂, etc.
- ⚡ **Infinite Real-Time Feed**: Live updates for posts, comments, and reactions.
- 📱 **Responsive UI**: Built with Next.js + Shadcn/UI.
- 🗄 **Database**: PostgreSQL with Prisma ORM.
- 🐳 **Dockerized**: Full environment setup with Docker Compose.

---

## 📋 Prerequisites

You can run this project in **two ways**:

1. Using **Docker** (recommended for production/dev parity).
2. Without Docker (manual setup).

Make sure you have installed:

- **Node.js**: v20+
- **PostgreSQL** (local or via pgAdmin)
- **Docker**: v20.10+ (if using Docker)

---

## 📂 Project Structure
```

social-media-app/
├── backend/ # NestJS backend source code
│ ├── prisma/ # Prisma schema and migrations
│ │ └── init.sql # DB initialization script
│ ├── uploads/ # Uploaded files (avatars, images)
│ └── Dockerfile # Backend Dockerfile
├── frontend/ # Next.js frontend source code
│ └── Dockerfile # Frontend Dockerfile
├── docker-compose.yml # Docker Compose config
├── .env.example # Example environment variables
└── README.md # This file

````

---

## ⚙️ Setup and Installation

### 🐳 Option 1: Run with Docker (Recommended)

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-repo/social-media-app.git
cd social-media-app
````

#### 2️⃣ Configure Environment Variables

Copy `.env.example` → `.env` and update values:

```bash
cp .env .
```

Example `.env`:

```env
# .env
# Database
POSTGRES_DB=social_media_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Backend
DATABASE_URL="postgresql://postgres:your_secure_password_here@postgres:5432/social_media_db?schema=public"

JWT_SECRET="n/SUj82r7McHK683Ze3e7N32FD6uMJqU8lPPHW8bOczLcl8d2yUqOHQoDH7tnf9q
NYy8NMwDBZE9MgdLha1uDQ=="  # Generate a strong one
# Add other backend envs (e.g., from your NestJS config)

# Frontend (if needed, e.g., API base URL)
NEXT_PUBLIC_API_URL=http://localhost:3001  # Points to backend


# Database Configuration
POSTGRES_DB=social_media_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET="n/SUj82r7McHK683Ze3e7N32FD6uMJqU8lPPHW8bOczLcl8d2yUqOHQoDH7tnf9q
NYy8NMwDBZE9MgdLha1uDQ=="
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database URL for Prisma
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public
```

#### 3️⃣ Build and Run

```bash
docker-compose build
docker-compose up -d
docker-compose exec backend npm run prisma:seed # Generate sample data
```

Services:

- **Postgres** → `localhost:5433`
- **Backend** → `localhost:3001`
- **Frontend** → `localhost:3000`

---

### 💻 Option 2: Run Without Docker

#### 1️⃣ Setup PostgreSQL

- Open **pgAdmin 4** (or CLI).
- Create a database (e.g., `social_media_db`).

#### 2️⃣ Configure Backend Environment

Inside `backend/.env`:

```env
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public
BACKEND_PORT=3001
JWT_SECRET=generate_secret_key
NODE_ENV=production
```

#### 3️⃣ Run Backend

```bash
cd backend
npm install
npx prisma init
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed   # generate sample data
npm run start:dev
```

Backend runs on → [http://localhost:3001](http://localhost:3001)

#### 4️⃣ Configure Frontend Environment

Inside `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 5️⃣ Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on → [http://localhost:3000](http://localhost:3000)

---

## ✅ Verification

- **Frontend**: [http://localhost:3000](http://localhost:3000) → Register/Login
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Database**: Connect via pgAdmin with your DB credentials

---

## 🛠 Tech Stack

- **Backend**: [NestJS](https://nestjs.com/), [Prisma ORM](https://www.prisma.io/)
- **Frontend**: [Next.js](https://nextjs.org/), [Shadcn/UI](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: JWT
- **Containerization**: Docker & Docker Compose

---
