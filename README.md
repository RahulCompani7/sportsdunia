This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

# 📰 SportsDunia

A dynamic sports news web app built using **Next.js**, powered by **Firebase Authentication**, **NewsData API**, and **Google Sheets API**. Authenticated users can view trending sports news and upload article payout data directly to a Google Sheet.

---

## 🚀 Features

- 🔐 Google Sign-in via Firebase
- 🗞️ Fetches live sports news from NewsData.io
- 📤 Upload curated payout data to a connected Google Sheet
- 📱 Fully responsive UI built with Tailwind CSS
- 🧠 Simple and clean dashboard UI

---

## 🛠 Tech Stack

- **Frontend:** Next.js (React-based)
- **Styling:** Tailwind CSS
- **Auth:** Firebase Authentication
- **Data Source:** NewsData.io (`newsApi.ai`)
- **Export:** Google Sheets API
- **Environment:** Vercel + Local Dev (`.env.local`)

---

## 🔧 Environment Setup

Create a `.env.local` file at the root of your project and paste the following:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# News API
NEXT_PUBLIC_NEWS_API_KEY=

# Google Sheets API
NEXT_PUBLIC_GOOGLE_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_SPREAD_SHEET_ID=
```

 Installation
```
# Clone the repository
git clone https://github.com/yourusername/sportsdunia.git

# Navigate into the directory
cd sportsdunia

# Install dependencies
npm install
```


Running the App Locally
```
npm run dev
```


 Usage
```
Sign in using your Google account.

Browse sports news fetched live from NewsData.io.

Fill in the payout entries from the dashboard.

Click "Upload" to push data into the connected Google Sheet.

🧹 Old data is cleared before each new upload to ensure no duplication.
```

Project Structure
```
sportsdunia/
├── app/
│   ├── components/        # UI Components (e.g., Dashboard)
│   ├── dashboard/         # Dashboard Logic and View
│   └── page.tsx           # Home Page
├── public/                # Static assets
├── styles/                # Global styles
├── utils/                 # API helpers, etc.
├── .env.local             # Your private env vars
├── README.md              # This file
```

🙏 Acknowledgements
Firebase

NewsData.io

Google Sheets API

Next.js

TailwindCSS

👤 Author
Made with ❤️ by Rahul Compani

