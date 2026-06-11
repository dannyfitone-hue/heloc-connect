This ZIP fixes the Vercel npm install failure.

What changed:
- Node pinned to 20.x instead of Vercel Node 24.x
- Next pinned to stable 14.2.16
- React pinned to 18.3.1
- Removed old lock files
- Removed root static index.html conflicts
- Added .npmrc with legacy-peer-deps=true
- Kept the HELOC CONNECT dark navy/gold frontend structure
- Kept smart calculator, portal/API-ready structure, Supabase/Twilio dependency support

Deploy steps:
1. Delete the old repo files or replace everything at the repo root with this ZIP contents.
2. Commit to GitHub.
3. In Vercel Project Settings > General:
   - Framework Preset: Next.js
   - Build Command: npm run build
   - Install Command: npm install
   - Output Directory: .next
   - Node.js Version: 20.x
4. Redeploy with "Clear Build Cache".
