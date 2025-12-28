# GitHub Actions Auto-Deploy Setup

This guide will help you set up automatic deployment to Firebase Hosting whenever you push to the `main` branch.

## What This Does

- **On push to main**: Automatically builds and deploys your app to production Firebase Hosting
- **On pull requests**: Creates a preview deployment with a temporary URL for testing

## Setup Steps

### 1. Get Your Firebase Service Account Key

Run this command in your project directory:

```bash
firebase login:ci
```

This will:
1. Open a browser for you to authenticate
2. Generate a CI token
3. Display the token in your terminal

**Copy this token** - you'll need it for GitHub secrets.

Alternative method (more secure, recommended for production):

```bash
# Create a service account
firebase init hosting:github

# This will:
# 1. Ask you to authenticate
# 2. Ask for your GitHub repo (format: username/repo-name)
# 3. Automatically create a PR with the workflow file and set up secrets
```

If you use `firebase init hosting:github`, it will automatically set up everything! Skip to step 3.

### 2. Add Secrets to GitHub Repository

If you got the token manually, go to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each of these secrets:

#### Required Secrets:

| Secret Name | Where to Get It |
|------------|-----------------|
| `FIREBASE_SERVICE_ACCOUNT` | The token from `firebase login:ci` command |
| `VITE_FIREBASE_API_KEY` | From your `.env` file |
| `VITE_FIREBASE_AUTH_DOMAIN` | From your `.env` file |
| `VITE_FIREBASE_PROJECT_ID` | From your `.env` file |
| `VITE_FIREBASE_STORAGE_BUCKET` | From your `.env` file |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From your `.env` file |
| `VITE_FIREBASE_APP_ID` | From your `.env` file |

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions, you don't need to add it.

### 3. Test the Deployment

1. Commit and push the workflow file:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions auto-deploy workflow"
   git push
   ```

2. Merge this branch to `main` (or push directly to `main`)

3. Go to your GitHub repository → **Actions** tab

4. You should see the workflow running!

5. Once complete, your app will be live at your Firebase Hosting URL

## How It Works

### On Every Push to Main:
1. ✅ Checks out your code
2. ✅ Sets up Node.js
3. ✅ Installs dependencies
4. ✅ Builds the app with your Firebase config
5. ✅ Deploys to Firebase Hosting (production)

### On Pull Requests:
1. ✅ Same build steps
2. ✅ Deploys to a preview URL
3. ✅ Comments on the PR with the preview link
4. ✅ Automatically deletes preview when PR is merged/closed

## Troubleshooting

### Deployment Fails with "Permission Denied"
- Make sure `FIREBASE_SERVICE_ACCOUNT` secret is set correctly
- Regenerate the token with `firebase login:ci`

### Build Fails with "Firebase not configured"
- Check that all `VITE_FIREBASE_*` secrets are set in GitHub
- Make sure there are no typos in the secret names

### Preview Deployments Not Working
- Check that the Firebase action has permission to comment on PRs
- Go to Settings → Actions → General → Workflow permissions
- Enable "Read and write permissions"

## Disabling Auto-Deploy

To disable automatic deployments:

1. Go to your repo → **Settings** → **Actions** → **General**
2. Under "Actions permissions", select "Disable actions"

Or simply delete the `.github/workflows/deploy.yml` file.

## Manual Deployment

You can still deploy manually anytime:

```bash
npm run build
firebase deploy --only hosting
```

## Viewing Deployment History

- **GitHub**: Go to the Actions tab to see all workflow runs
- **Firebase Console**: Go to Hosting → Dashboard to see deployment history
