# MentorLink

[![Next.js](https://img.shields.io/badge/Next.js-13%2B-blue)](https://nextjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-blue)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)


> A modern web platform revolutionizing academic mentorship management.

## 🌐 Live Preview

<a href="https://mentorlink-nu.vercel.app" target="_blank" rel="noopener noreferrer">MentorLink</a> is live on Vercel.


## 🎯 Overview

MentorLink streamlines academic mentorship by providing:

- 🤝 Smart mentor-mentee matching
- 📅 Intuitive meeting management
- 📊 Comprehensive progress tracking
- 💬 Real-time communication
- 📈 Data-driven insights

## 🛠️ Tech Stack

- **Frontend:** Next.js 13+ (App Router),,Javascript, TypeScript, Tailwind CSS,Framer Motion
- **Backend:** Next.js API Routes, MongoDB, Mongoose
- **Security:** JWT, Route Protection,Session Management
- **Deployment:** Vercel

## 🔑 Key Features

### 👥 User Management
- Multi-role authentication (Admin/Mentor/Mentee)
- Profile customization
- Secure session handling

### 🤝 Mentorship System
- Intelligent matching algorithm
- Meeting scheduling
- Progress monitoring

### ⚙️ Administrative Tools
- Batch operations
- Analytics dashboard
- Data management

## 🏗️ Architecture

```
src/
├── app/          # App Router pages
├── components/   # Reusable components
├── lib/         # Utilities and helpers
├── models/      # Database models
└── types/       # TypeScript definitions
```

## 🚀 Quick Start For Development

1. Create `.env` file
2. Copy content from `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`

### 📧 Setting up Gmail App Password

⚠️ Important: Never share your App Password or commit it to version control!

1. Go to your [Google Account Settings](https://myaccount.google.com/)
2. Enable 2-Step Verification if not already enabled
3. Navigate to [Security → App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and your device
5. Click "Generate"
6. Copy the 16-character password
7. Add to `EMAIL_PASS` in your .env file

Note: 
- Keep your App Password secure
- Use a dedicated email for development
- Revoke access immediately if compromised
- Consider using email service providers for production

### 🔐 Setting up reCAPTCHA v3

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Register a new site
   - Choose reCAPTCHA v3
   - Add your domain (use localhost for development)
   - Accept the terms and register
3. You'll receive two keys:
   - Site Key: Add to `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY`
   - Secret Key: Add to `RECAPTCHA_SECRET_V3_KEY`

Visit [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

Automatically deployed to [Vercel](https://mentorlink-nu.vercel.app/)

## 📄 License

MIT © MentorLink Team

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

<!-- ## 📚 Resources

- [Documentation](docs/)
- [API Reference](docs/api/)
- [Contributing Guide](CONTRIBUTING.md) -->
