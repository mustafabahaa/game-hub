# Game Hub

A modern, multi-tenant SaaS application built with Next.js 15, Tailwind CSS, and Supabase for managing gaming accounts, vaults, and game collections.

## Features
- **Multi-Tenant Architecture**: Each user has their own completely isolated vault, secured at the database level using Supabase Row Level Security (RLS).
- **Nested Accounts & Games**: Create account containers (PlayStation, Xbox, PC) and organize your game library within each account.
- **Dynamic Collages**: Account cards dynamically generate a visual collage based on the game thumbnails stored within them.
- **Premium Aesthetics**: Built with a sleek dark mode, glassmorphism UI, Aurora background gradients, and smooth micro-animations.
- **Provider Management**: Keep track of account providers and vendors directly in your dashboard.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Lucide React Icons
- **Backend & Auth**: Supabase (Database, Auth, Storage)

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Supabase Project (for your own database)

### 2. Environment Setup
Create a `.env.local` file in the root of the project and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Supabase)
You will need to run the initial SQL migrations in your Supabase SQL Editor. The required tables are:
- `accounts`
- `games` 
- `providers`
- And the `game-images` public storage bucket.
Ensure all tables have `user_id` columns and RLS policies configured to strictly check `user_id = auth.uid()`.

### 4. Installation
Install the project dependencies:
```bash
npm install
```

### 5. Run the Development Server
Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
