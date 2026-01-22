# Campus Connect

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/PrakharDoneria/Campus-Connect)](https://github.com/PrakharDoneria/Campus-Connect/issues)
[![GitHub forks](https://img.shields.io/github/forks/PrakharDoneria/Campus-Connect)](https://github.com/PrakharDoneria/Campus-Connect/network)
[![GitHub stars](https://img.shields.io/github/stars/PrakharDoneria/Campus-Connect)](https://github.com/PrakharDoneria/Campus-Connect/stargazers)

Campus Connect is a localized, open-source social network for college students. Built with Next.js, Firebase, and MongoDB, it aims to connect students on the same campus by leveraging geolocation features.

## CommitAds

[![Sponsored Ad by CommitAds](https://commitads.netlify.app/api/serve/ofkiVjsVlOdIbbac7uHAItIhQEA2/M2q04kjLqXMQCi5a68kT)](https://commitads.netlify.app/api/serve/ofkiVjsVlOdIbbac7uHAItIhQEA2/M2q04kjLqXMQCi5a68kT/check)

## Core Features

- **Easy & Secure Sign-Up**: Quick onboarding using Google or GitHub accounts.
- **Nearby Students Discovery**: Find and connect with other students on your campus within a configurable radius.
- **Vibrant Campus Feed**: A mobile-first social feed for sharing posts, assignments, doubts, and announcements with others at your university.
- **Community Circles**: Join or create communities for your university, major, or interests.
- **Real-time Chat**: Message your friends in real-time and start video calls instantly.
- **Open Source**: Designed for contribution, with clear documentation and a modular architecture.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (with `2dsphere` for geo-queries)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) (Google & GitHub)
- **Real-time Chat**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **AI Features**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
- **Push Notifications**: Web Push API with VAPID
- **Schema Validation**: [Zod](https://zod.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm
- A Firebase project
- A MongoDB Atlas cluster
- A Google AI API Key

### 1. Clone the repository

```bash
git clone https://github.com/PrakharDoneria/Campus-Connect.git
cd Campus-Connect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root of the project. You will need to fill in the following values:

- **Firebase**: Go to your Firebase project settings and copy your web app's configuration into the `NEXT_PUBLIC_FIREBASE_*` variables.
- **MongoDB**: Get your connection string from your MongoDB Atlas dashboard and set it as `MONGODB_URI`. Make sure to add your IP address to the IP access list in Atlas.
- **Google AI**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and set it as `GOOGLE_API_KEY`.
- **Push Notifications (VAPID Keys)**: Generate a VAPID key pair for push notifications using `npx web-push generate-vapid-keys`. Add the public key to `NEXT_PUBLIC_FIREBASE_VAPID_KEY` and private key to `VAPID_PRIVATE_KEY`. See [docs/PUSH_NOTIFICATIONS.md](docs/PUSH_NOTIFICATIONS.md) for detailed setup instructions.
- **Cloudinary**: Get your Cloudinary URL from the dashboard and set it as `CLOUDINARY_URL` for image uploads.

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

We welcome contributions from students and developers everywhere! Please see our [`CONTRIBUTING.md`](CONTRIBUTING.md) file for detailed guidelines on how to get involved.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
