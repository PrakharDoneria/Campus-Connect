# **App Name**: Campus Connect

## Core Features:

- Student Verification: Verify student status via email domain validation (.edu suffixes) during signup using Firebase Auth.
- User Profile Sync: Synchronize Firebase UID with MongoDB document to store user data (location, major, university).
- Location Input Assistance: AI tool that converts human-readable addresses into geographical coordinates using a map.
- Nearby Students Discovery: Use MongoDB 2dsphere index and $near operator to display nearby students within a radius.
- Mobile-First Campus Feed: Display a campus-specific social feed for sharing posts, events, and announcements.
- Real-Time Discovery Dashboard: Show a dashboard of users based on configurable proximity settings.
- Contribution Guide: Clear .env.example and documentation to facilitate open-source contribution.

## Style Guidelines:

- Primary color: A vibrant purple (#A06CD5) to convey a modern and energetic college atmosphere.
- Background color: A light, desaturated purple (#F0E6F8) to ensure readability and reduce eye strain.
- Accent color: A lively orange (#FF7F50), for interactive elements and calls to action.
- Body and headline font: 'Inter', a grotesque-style sans-serif, for a clean and neutral look throughout the app.
- Use minimalist, outline-style icons to represent various features and actions.
- Implement a clean, mobile-first layout using Tailwind CSS grid and flexbox.
- Use subtle animations for transitions and interactive elements to enhance user experience.