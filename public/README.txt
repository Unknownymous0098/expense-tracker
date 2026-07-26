EXPENSE TRACKER V2.1 — MOBILE HEADER REDESIGN

Edited files
- index.html
- expenses.html
- income.html
- reports.html
- settings.html
- style.css
- service-worker.js

Changes
- Added/confirmed a descriptive subtitle on every main page
- Reduced the large blank area in the mobile header
- Centered page titles and subtitles consistently
- Converted the Welcome message into a compact pill
- Kept the hamburger button aligned at the upper-left
- Preserved desktop layout and dark mode
- Bumped the PWA cache to force the updated CSS to load

How to install
1. Extract this ZIP.
2. Copy the files into your project's public folder.
3. Keep your existing server.js, package.json, database and images folder.
4. Push the update:

   git add .
   git commit -m "Redesign compact mobile headers"
   git push origin main

5. Wait for Render to finish deploying.
6. Open the website in Chrome and refresh.
7. For an installed PWA, close it completely and reopen it.
8. If the old design remains, uninstall the PWA once and reinstall it.
