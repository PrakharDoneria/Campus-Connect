# Campus Connect

Campus Connect is a localized, open-source social network for college students. Built with Next.js, Firebase, and MongoDB, it aims to connect students on the same campus by leveraging geolocation features.

## CommitAds

[![CommitAds](https://commitads.netlify.app/api/serve/ofkiVjsVlOdIbbac7uHAItIhQEA2/M2q04kjLqXMQCi5a68kT)](https://commitads.netlify.app/api/serve/ofkiVjsVlOdIbbac7uHAItIhQEA2/M2q04kjLqXMQCi5a68kT/check)

## Core Features

- **Student Verification**: Signup is restricted to users with a valid university email address (e.g., `.edu`).
- **Nearby Students Discovery**: Find and connect with other students on your campus within a configurable radius.
- **Campus Feed**: A mobile-first social feed for sharing posts, events, and announcements with others at your university.
- **AI-Powered Location**: Uses AI to convert human-readable addresses into geographical coordinates for profile setup.
- **Real-time Chat**: Message your friends in real-time and start video calls instantly.
- **Open Source**: Designed for contribution, with clear documentation and a modular architecture.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Firebase](https://firebase.google.com/) (Authentication, Firestore for real-time chat, Cloud Messaging)
- [MongoDB Atlas](https://www.mongodb.com/atlas) (with `2dsphere` for geo-queries)
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- [Genkit](https://firebase.google.com/docs/genkit) (for AI features)
- [Zod](https://zod.dev/) (for schema validation)
- [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Firebase project
- A MongoDB Atlas cluster
- A Google AI API Key

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

Create a `.env` file in the root of the project by copying the example structure from `.env`. You will need to fill in the following values:

- **Firebase**: Go to your Firebase project settings and copy your web app's configuration into the `NEXT_PUBLIC_FIREBASE_*` variables.
- **MongoDB**: Get your connection string from your MongoDB Atlas dashboard and set it as `MONGODB_URI`. Make sure to add your IP address to the IP access list in Atlas.
- **Google AI**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and set it as `GOOGLE_API_KEY`.
- **Push Notifications (VAPID Keys)**: Generate a VAPID key pair for push notifications using `npx web-push generate-vapid-keys`. Add the public key to `NEXT_PUBLIC_FIREBASE_VAPID_KEY` and private key to `VAPID_PRIVATE_KEY`. See [docs/PUSH_NOTIFICATIONS.md](docs/PUSH_NOTIFICATIONS.md) for detailed setup instructions.

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

We welcome contributions from students and developers everywhere! Please see our `CONTRIBUTING.md` file for detailed guidelines on how to get involved.
