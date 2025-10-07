# 📱 Social Media Application

A full-stack **social media application** built with a **NestJS backend**, **Next.js frontend**, and a **PostgreSQL database**.
Supports **user authentication, profiles, posts, comments, reactions, follow system, personalized feeds, hashtags, mentions, search, and draft autosave** with a **responsive UI** and **real-time updates**.

---

## ✨ Features

### Core Features
- 🔐 **User Authentication**: Register, login, logout with JWT-based authentication
- 👤 **Profile Management**: Update name, bio, avatar with comprehensive stats
- 📝 **Posts**: Create, view, edit, delete posts with images
- 💬 **Nested Comments**: Reply to comments in a thread-like structure
- 🎭 **Multiple Reactions**: Like 👍, love ❤️, laugh 😂, wow 😮, sad 😢, angry 😠
- ⚡ **Infinite Scroll Feed**: Smooth infinite scrolling for posts
- 📱 **Responsive UI**: Built with Next.js + Shadcn/UI + Tailwind CSS

### Social Features
- 🧑‍🤝‍🧑 **Follow System**: Follow/unfollow users, view followers and following lists
- 📰 **Personalized Feed**: See posts from users you follow with infinite scroll
- 🌍 **Explore Feed**: Discover popular posts sorted by engagement
- 👥 **User Profiles**: View any user's profile, posts, and stats
- 📊 **Statistics**: Track followers, following, posts, comments, and reactions

### Content Discovery
- 🧵 **Hashtags**: Auto-detect and create clickable #hashtags in posts
- 📢 **Mentions**: Auto-detect and link @mentions to user profiles
- 🔍 **Advanced Search**: Search users, posts, and hashtags with real-time suggestions
- 🏷️ **Hashtag Pages**: View all posts with a specific hashtag
- 📜 **Search History**: Track and clear your search history

### Productivity
- 💾 **Draft Posts**: Auto-save drafts while typing (2-second debounce)
- 📝 **Draft Management**: Save, edit, and delete drafts
- ✍️ **Rich Text Parsing**: Clickable hashtags and mentions in all posts

### Technical Features
- 🗄️ **Database**: PostgreSQL with Prisma ORM
- 🐳 **Dockerized**: Full environment setup with Docker Compose
- 🔄 **Real-time Updates**: React Query for data synchronization
- 🚀 **Performance**: Cursor-based and offset pagination
- 🎨 **UI Components**: Shadcn/UI component library
- 📦 **Type Safety**: Full TypeScript support

---

## 📋 Prerequisites

You can run this project in **two ways**:

1. Using **Docker** (recommended for production/dev parity)
2. Without Docker (manual setup)

Make sure you have installed:

- **Node.js**: v20+
- **PostgreSQL** (local or via pgAdmin)
- **Docker**: v20.10+ (if using Docker)

---

## 📂 Project Structure

```
social-media-app/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── posts/             # Posts with hashtag/mention detection
│   │   ├── comments/          # Nested comments
│   │   ├── reactions/         # Post reactions
│   │   ├── follow/            # Follow system
│   │   ├── feed/              # Personalized & explore feeds
│   │   ├── search/            # Search functionality
│   │   └── draft/             # Draft management
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── uploads/               # User uploads (avatars, images)
│   └── Dockerfile
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js app router
│   │   │   ├── feed/          # Personalized feed page
│   │   │   ├── search/        # Search results page
│   │   │   ├── hashtag/       # Hashtag detail pages
│   │   │   ├── profile/       # User profile pages
│   │   │   └── auth/          # Authentication pages
│   │   ├── components/
│   │   │   ├── posts/         # Post components
│   │   │   ├── follow/        # Follow button
│   │   │   ├── search/        # Search bar
│   │   │   └── ui/            # Shadcn UI components
│   │   ├── hooks/
│   │   │   ├── useFollow.ts   # Follow hooks
│   │   │   ├── useFeed.ts     # Feed hooks
│   │   │   ├── useSearch.ts   # Search hooks
│   │   │   ├── useDrafts.ts   # Draft hooks
│   │   │   └── usePosts.ts    # Post hooks
│   │   └── lib/
│   │       └── textParser.tsx # Hashtag/mention parser
│   └── Dockerfile
├── docker-compose.yml          # Docker Compose config
└── .env                        # Environment variables
```

---

## ⚙️ Setup and Installation

### 🐳 Option 1: Run with Docker (Recommended)

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-repo/social-media-app.git
cd social-media-app
```

#### 2️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
POSTGRES_DB=social_media_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET=your_jwt_secret_here_generate_a_strong_one
NODE_ENV=production

# Frontend Configuration
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database URL for Prisma
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public
```

#### 3️⃣ Build and Run

```bash
# Build and start all services
docker-compose up -d

# Run database migrations
docker exec social_media_backend_dev sh -c "npx prisma migrate dev"

# (Optional) Seed sample data
docker exec social_media_backend_dev sh -c "npm run prisma:seed"
```

**Services:**
- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **Backend API** → [http://localhost:3001](http://localhost:3001)
- **PostgreSQL** → `localhost:5432` (internal) / `5433` (external)

---

### 💻 Option 2: Run Without Docker

#### 1️⃣ Setup PostgreSQL

- Install PostgreSQL locally
- Create a database (e.g., `social_media_db`)

#### 2️⃣ Configure Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/social_media_db?schema=public
BACKEND_PORT=3001
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

#### 3️⃣ Run Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run start:dev
```

Backend runs on → [http://localhost:3001](http://localhost:3001)

#### 4️⃣ Configure Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 5️⃣ Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on → [http://localhost:3000](http://localhost:3000)

---

## 🚀 Quick Start Guide

### 1. Create an Account
- Navigate to [http://localhost:3000](http://localhost:3000)
- Click "Register" and create your account
- Upload an avatar and add a bio

### 2. Create Your First Post
- Type a title and content (use #hashtags and @mentions!)
- Upload an image (optional)
- Click "Share Post"
- Your draft auto-saves while typing

### 3. Discover Users
- Use the search bar to find users
- Click on usernames to view their profiles
- Follow users you're interested in

### 4. Explore Content
- Click "Feed" to see posts from people you follow
- Use hashtags to find related content
- React and comment on posts

### 5. Engage with Community
- Follow/unfollow users
- Like, love, or react to posts
- Reply to comments
- Search for topics using hashtags

---

## 📚 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Users
- `GET /users/:id` - Get user profile
- `GET /users/profile` - Get current user profile

### Posts
- `POST /posts` - Create post (auto-detects hashtags/mentions)
- `GET /posts` - Get all posts
- `GET /posts/user/:userId` - Get user's posts
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

### Follow System
- `POST /follow/:userId` - Follow user
- `DELETE /follow/:userId` - Unfollow user
- `GET /follow/followers/:userId` - Get followers
- `GET /follow/following/:userId` - Get following
- `GET /follow/counts/:userId` - Get follower/following counts
- `GET /follow/status/:userId` - Check follow status

### Feed
- `GET /feed` - Get personalized feed (authenticated)
- `GET /feed/explore` - Get explore feed (popular posts)

### Search
- `GET /search?q=query` - Search users, posts, hashtags
- `GET /search/suggestions?q=query` - Get search suggestions
- `GET /search/hashtag/:name` - Get posts by hashtag
- `GET /search/history` - Get search history
- `DELETE /search/history` - Clear search history

### Drafts
- `POST /drafts` - Create/update draft
- `GET /drafts` - Get all drafts
- `DELETE /drafts/:id` - Delete draft

### Comments
- `POST /comments` - Create comment
- `GET /comments/posts/:postId` - Get post comments

### Reactions
- `POST /reactions` - Add/update reaction
- `DELETE /reactions/:postId` - Remove reaction

**Full API Documentation**: See [API_ROUTES_SUMMARY.md](API_ROUTES_SUMMARY.md)

---

## 🛠 Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation ORM
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Relational database
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) - React framework with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) - Re-usable components
- **State Management**: [React Query](https://tanstack.com/query) - Data fetching & caching
- **Animations**: [Framer Motion](https://www.framer.com/motion/) - Animation library
- **Date Formatting**: date-fns

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Environment**: Docker multi-stage builds

---

## 📖 Additional Documentation

- **[FEATURES_ADDED.md](FEATURES_ADDED.md)** - Detailed feature documentation
- **[FOLLOW_API_GUIDE.md](FOLLOW_API_GUIDE.md)** - Follow system API guide
- **[API_ROUTES_SUMMARY.md](API_ROUTES_SUMMARY.md)** - Complete API reference
- **[USER_PROFILE_GUIDE.md](USER_PROFILE_GUIDE.md)** - User profile usage guide

---

## 🎯 Key Features Explained

### Follow System
- Follow/unfollow other users
- View followers and following lists with pagination
- Real-time follower count updates
- Follow button on user profiles

### Personalized Feed
- Shows posts from users you follow
- Infinite scroll for seamless browsing
- Includes your own posts
- Chronologically ordered

### Hashtags & Mentions
- **Hashtags**: Type `#topic` in posts to create clickable hashtags
- **Mentions**: Type `@username` to mention and link to users
- Hashtag pages show all related posts
- Automatic extraction and database storage

### Search Functionality
- **Real-time suggestions** as you type
- Search across users, posts, and hashtags
- Organized results in tabs
- Search history tracking
- Case-insensitive search

### Draft Auto-save
- Automatically saves drafts while typing
- 2-second debounce to minimize API calls
- Drafts persist across sessions
- Clear draft after publishing

---

## 🎨 Screenshots

### Home Feed
![Home Feed](docs/screenshots/home-feed.png)

### User Profile
![User Profile](docs/screenshots/user-profile.png)

### Search Results
![Search](docs/screenshots/search.png)

### Hashtag Page
![Hashtags](docs/screenshots/hashtag.png)

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@your-username](https://github.com/your-username)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Shadcn/UI](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the maintainers
- Check the documentation files

---

**Built with ❤️ using NestJS, Next.js, and PostgreSQL**
