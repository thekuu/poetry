# Poet Society

An elegant, modern, mobile-first Amharic poetry platform where users can read poems, write and publish poems without registration, and reply to form a continuous poetic conversation.

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS 4, React Router 7, TanStack Query 5
- **Backend**: Node.js, Express, TypeScript
- **Database**: Neon PostgreSQL, Drizzle ORM

## Project Structure
- `/frontend`: React application (UI, pages, components, API client)
- `/backend`: Express application (Routes, Controllers, DB Schema, Migrations)
- `server.ts`: The combined entry point that mounts the API and serves the frontend

## Setup Instructions

### 1. Database Setup
1. Create a [Neon](https://neon.tech/) PostgreSQL project.
2. Get the connection string.

### 2. Environment Variables
Create a `.env` file in the root directory (copy from `.env.example`):

```env
DATABASE_URL="postgres://user:password@ep-small-snow-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require"
PORT=3000
NODE_ENV="development"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Migrations & Seeding
Generate and run migrations to create the tables in your Neon database:
```bash
npm run db:generate
npm run db:migrate
```

Optionally, seed the database with some example Amharic poetry conversations:
```bash
npm run db:seed
```

### 5. Running Locally
Start the development server:
```bash
npm run dev
```
The application will run on `http://localhost:3000`.

### 6. Production Build
Build the application:
```bash
npm run build
```
Start the production server:
```bash
npm start
```

## Anonymous Ownership Mechanism
The platform uses a cryptographically secure anonymous token generated on the client-side during the user's first interaction (writing a poem or reply). This token is stored in the browser's `localStorage` and sent with requests. The backend hashes this token using `SHA-256` before storing it in the database. When editing or deleting, the backend verifies that the hash of the provided token matches the stored hash, ensuring secure ownership without user accounts or passwords.
