# Game Hub - Multi-Tenant SaaS Platform

Welcome to Game Hub, a secure, multi-tenant platform for managing your PlayStation, Xbox, and Steam game collections.

## Features

- **Multi-Tenant Architecture**: Complete data isolation using Supabase Row Level Security (RLS). Every user has a strictly private workspace.
- **Game Vault**: Store, track, and manage your purchased games across platforms.
- **Provider Integrations**: Add custom providers or social links associated with your account.
- **Premium Design**: Built with Next.js App Router, Tailwind CSS, and WebGL animations for a stunning user experience.

## Getting Started

### Prerequisites

- Node.js (v18+)
- A Supabase Project (Database, Auth, Storage)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mustafabahaa/game-hub.git
   cd game-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database & Storage Setup

You must configure your Supabase instance to run the application correctly:

1.  **Tables**:
    -   `accounts`: Needs columns `id`, `user_id`, `account_name`, `email`, `password`, `otp_secret`, `provider_id`, `account_type`, `platform`, `is_ps_plus`, `created_at`, `updated_at`.
    -   `games`: Needs columns `id`, `account_id`, `title`, `image_url`, `created_at`.
    -   `providers`: Needs columns `id`, `user_id`, `name`, `email`, `password`, `notes`, `photo_url`, `created_at`.
2.  **Row Level Security (RLS)**: Enable RLS on all tables, creating policies where `user_id = auth.uid()`.
3.  **Storage**: Create a public bucket named `game-images` and apply RLS policies for authenticated users.

## Deployment

The application is fully optimized for Vercel deployment. It has 0 linting errors and passing builds.
Simply connect your GitHub repository to Vercel and add the corresponding `.env` variables in your project settings.

## License

This project is licensed under the MIT License.
