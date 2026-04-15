# GitHub Deployment Setup

This repository is now configured with GitHub Actions for:
- CI checks on push and pull requests
- Frontend deployment to GitHub Pages

## 1. Push to GitHub

From repository root:

```powershell
git init
git add .
git commit -m "Add GitHub CI and deployment workflows"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If your repo is already connected, just commit and push.

## 2. Enable GitHub Pages

In your GitHub repo:
1. Go to Settings.
2. Open Pages.
3. Under Build and deployment, set Source to GitHub Actions.

After your next push to main, workflow Deploy Frontend to GitHub Pages runs automatically.

## 3. URLs

- App URL format: `https://<your-username>.github.io/<your-repo>/`

## 4. Workflows included

- `.github/workflows/ci.yml`
  - Frontend lint + build
  - Backend dependency install + syntax check
  - Python syntax checks for key service files

- `.github/workflows/deploy-frontend-pages.yml`
  - Builds `project` app with the correct base path for repo hosting
  - Publishes `project/dist` to GitHub Pages

## 5. Notes

- GitHub Pages deploys only the frontend static site.
- Backend, ML, and LLM services still need a runtime host (for example: Render, Railway, Azure, or your own VM/container host).
- If frontend API calls fail after Pages deployment, set your production API URLs in the frontend environment and redeploy.
