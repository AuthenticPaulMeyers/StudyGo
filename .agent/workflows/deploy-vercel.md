---
description: How to deploy StudyGo to Vercel
---

# Deploying StudyGo to Vercel

Follow these steps to deploy your application to Vercel.

## 1. Prepare Environment Variables

You will need your Supabase credentials. Get them from your Supabase Project Settings > API.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 2. Deploy via Vercel Dashboard (Recommended)

1.  **Push your code to GitHub/GitLab/Bitbucket.**
2.  Go to the [Vercel Dashboard](https://vercel.com/new).
3.  **Import** your `StudyGo` repository.
4.  In the **Configure Project** section:
    - **Framework Preset**: Vite (automatically detected).
    - **Root Directory**: `./`
    - **Environment Variables**: Add the variables from Step 1.
5.  Click **Deploy**.

## 3. Deploy via Vercel CLI

If you prefer the command line:

1.  **Install Vercel CLI**:
    ```bash
    npm i -g vercel
    ```
2.  **Login**:
    ```bash
    vercel login
    ```
3.  **Link and Deploy**:
    ```bash
    vercel
    ```
    - Follow the prompts (Select "Y" for default settings).
4.  **Add Environment Variables**:
    Go to the Vercel Dashboard for your project to add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings > Environment Variables**.
5.  **Redeploy**:
    ```bash
    vercel --prod
    ```

## 4. Single Page Application (SPA) Routing

We have included a `vercel.json` file in the root to ensure that all routes correctly point to `index.html`. This is necessary for the JavaScript router to function properly after deployment.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Troubleshooting

- **404 on Refresh**: Ensure `vercel.json` is in the root directory.
- **Data not loading**: Check that environment variables are prefixed with `VITE_` and are correctly set in the Vercel dashboard.
- **Permission Denied (`vite: Permission denied`)**: 
    This happens when Vercel lacks permission to run the Vite binary.
    1. I have updated the `build` script in `package.json` to: `"node node_modules/vite/bin/vite.js build"`
    2. In the Vercel dashboard (**Settings > Build & Development Settings**), ensure the **Build Command** is set to `npm run build` (or left as default).
    3. Redeploy with **"Clean Build Cache"** checked.
