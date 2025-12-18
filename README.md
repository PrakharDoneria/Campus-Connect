# Campus Connect

Campus Connect is a localized, open-source social network for college students. Built with Next.js, Firebase, and MongoDB, it aims to connect students on the same campus by leveraging geolocation features.

## Core Features

- **Student Verification**: Signup is restricted to users with a valid university email address (e.g., `.edu`).
- **Nearby Students Discovery**: Find and connect with other students on your campus within a configurable radius.
- **Campus Feed**: A mobile-first social feed for sharing posts, events, and announcements with others at your university.
- **AI-Powered Location**: Uses AI to convert human-readable addresses into geographical coordinates for profile setup.
- **Open Source**: Designed for contribution, with clear documentation and a modular architecture.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [MongoDB Atlas](https://www.mongodb.com/atlas) (with `2dsphere` for geo-queries)
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- [Genkit](https://firebase.google.com/docs/genkit) (for AI features)
- [Zod](https://zod.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Firebase project
- A MongoDB Atlas cluster

### 1. Clone the repository

```bash
git clone https://github.com/your-repo/campus-connect.git
cd campus-connect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project by copying the example file:

```bash
cp .env.example .env.local
```

Now, fill in the required values in `.env.local`:

- **Firebase**: Go to your Firebase project settings and copy your web app's configuration into the `NEXT_PUBLIC_FIREBASE_*` variables.
- **MongoDB**: Get your connection string from your MongoDB Atlas dashboard and set it as `MONGODB_URI`. Make sure to add your IP address to the IP access list in Atlas.
- **Google AI**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and set it as `GOOGLE_API_KEY`.

### 4. Set up MongoDB Index

For the "Nearby Students" feature to work, you must create a `2dsphere` index on the `users` collection.

1.  Go to your MongoDB Atlas cluster.
2.  Navigate to the `users` collection in your database.
3.  Go to the "Indexes" tab.
4.  Create a new index with the following configuration:
    - **Field**: `location`
    - **Type**: `2dsphere`

### 5. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## How to Contribute

We welcome contributions! Please see our `CONTRIBUTING.md` file for guidelines on how to get involved.
