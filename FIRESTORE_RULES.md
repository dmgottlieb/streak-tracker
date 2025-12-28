# Firestore Security Rules

Use these rules in your Firebase Console to fix the delete issue.

## How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Replace the rules with the code below
5. Click **Publish**

## Correct Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Streaks collection rules
    match /streaks/{streakId} {
      // Allow read if authenticated and user owns the streak
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // Allow create if authenticated and setting correct userId
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;

      // Allow update if authenticated and user owns the streak
      allow update: if request.auth != null
                    && resource.data.userId == request.auth.uid;

      // Allow delete if authenticated and user owns the streak
      allow delete: if request.auth != null
                    && resource.data.userId == request.auth.uid;
    }
  }
}
```

## What Changed

The previous rules had a bug in the write permission:
- ❌ Old: `allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;`
- ✅ New: Separate create, update, and delete permissions

The issue was that `request.resource.data.userId` doesn't exist during delete operations (there's no new data being written). The fix splits the permissions so delete only checks the existing `resource.data.userId`.

## Testing

After updating the rules:
1. Try deleting a streak in your app
2. It should now work correctly
3. You'll see a confirmation dialog, then the streak disappears

## Troubleshooting

If delete still doesn't work:
1. Check browser console for errors (F12 → Console tab)
2. Make sure you're signed in
3. Try signing out and back in
4. Check that the rule was published (you should see a green "Published" message)
