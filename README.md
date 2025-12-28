# Streak Tracker

A Progressive Web App (PWA) for tracking daily habits and building streaks. Monitor multiple habits, check off daily completions, and view your progress over time with a calendar view.

## Features

- ✅ Track multiple daily habits/streaks
- 📅 Calendar view to review and edit past days
- 📝 Add notes to daily completions
- 📊 View current streak counts
- 📱 Works on desktop and mobile
- 🔄 Cloud sync across devices via Firebase
- 💾 Export data to JSON for analysis
- 📲 Installable as a PWA on Android/iOS

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Firebase (Firestore + Authentication)
- **PWA**: Vite PWA Plugin with Workbox
- **Styling**: Custom CSS with responsive design

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google account (for Firebase)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Once created, click on "Web" icon (</>) to add a web app
4. Register your app with a nickname (e.g., "Streak Tracker")
5. Copy the Firebase configuration object

### 3. Configure Firebase Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

### 4. Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** sign-in provider
3. Add your app's domain to authorized domains (for local dev, `localhost` should already be there)

#### Enable Firestore Database:
1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add security rules next)
4. Select a location closest to your users

#### Set up Firestore Security Rules:
1. Go to **Firestore Database** > **Rules**
2. Replace the rules with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Only authenticated users can read/write their own streaks
       match /streaks/{streakId} {
         allow read, write: if request.auth != null &&
                               request.resource.data.userId == request.auth.uid;
         allow read: if request.auth != null &&
                        resource.data.userId == request.auth.uid;
       }
     }
   }
   ```
3. Click **Publish**

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### 6. Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### 7. Preview Production Build

```bash
npm run preview
```

## Deployment

### Option 1: Firebase Hosting (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Hosting:
   ```bash
   firebase init hosting
   ```
   - Choose your existing Firebase project
   - Set public directory to: `dist`
   - Configure as single-page app: **Yes**
   - Set up automatic builds with GitHub: **No** (or Yes if you prefer)

4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

Your app will be live at `https://your-project-id.web.app`

### Option 2: Vercel, Netlify, or Other Platforms

1. Build the app: `npm run build`
2. Deploy the `dist` folder to your preferred platform
3. Make sure to set the environment variables in your hosting platform's dashboard

## Installing as PWA on Android

1. Open the deployed app in Chrome on Android
2. Tap the menu (⋮) and select "Install app" or "Add to Home screen"
3. The app will be installed and can be launched like a native app

## Usage

### Adding a Streak

1. Sign in with your Google account
2. Click "Add Streak" button
3. Enter the streak name (e.g., "Daily Salad")
4. Set the start date (can be in the past to record existing streaks)
5. Click "Create Streak"

### Checking Off Daily Streaks

- Simply check the box next to each streak you completed today
- The streak count updates automatically

### Viewing History

1. Click the "📅 History" button on any streak
2. Navigate months using the ← → arrows
3. Click on any day to add/edit completion or add a note
4. Green days indicate completed streaks
5. Days with 📝 icon have notes

### Exporting Data

1. Click "Export Data" in the header
2. A JSON file will download with all your streak data
3. You can analyze this data with tools like Excel, Python, R, etc.

## Project Structure

```
streak-tracker/
├── public/                 # Static assets and PWA icons
├── src/
│   ├── components/        # React components
│   │   ├── Header.jsx
│   │   ├── StreakList.jsx
│   │   ├── StreakItem.jsx
│   │   ├── AddStreakModal.jsx
│   │   └── CalendarModal.jsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useStreaks.js
│   ├── services/         # Firebase and API services
│   │   ├── firebase.js
│   │   └── streakService.js
│   ├── utils/            # Utility functions
│   │   └── dateUtils.js
│   ├── App.jsx           # Main app component
│   ├── App.css           # Styles
│   └── main.jsx          # Entry point
├── .env.example          # Example environment variables
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies
```

## Data Model

Streaks are stored in Firestore with the following structure:

```javascript
{
  id: "streak-id",
  userId: "user-google-id",
  name: "Daily Salad",
  startDate: "2022-07-01",
  completions: {
    "2022-07-01": { completed: true, note: "Caesar salad" },
    "2022-07-02": { completed: true, note: "" },
    // ... more dates
  },
  createdAt: timestamp
}
```

## Troubleshooting

### "Firebase Not Configured" Error
- Make sure you created a `.env` file with your Firebase credentials
- Verify all environment variables start with `VITE_`
- Restart the dev server after adding/changing `.env` file

### Authentication Issues
- Check that Google sign-in is enabled in Firebase Console
- Make sure your domain is in the authorized domains list
- Clear browser cache and cookies

### Data Not Syncing
- Check your Firestore security rules
- Verify you're signed in
- Check browser console for errors

### PWA Not Installing
- Make sure you're using HTTPS (or localhost)
- Check that manifest.json is being served correctly
- Look for PWA installation prompts in Chrome DevTools > Application > Manifest

## License

MIT

## Contributing

This is a personal project, but feel free to fork and customize for your own use!
