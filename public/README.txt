EXPENSE TRACKER V2 CLEAN PROJECT

This package cleans the uploaded front-end files and permanently fixes the missing mobile page subtitles.

Changes:
- Unified mobile header on Dashboard, Expenses, Income, Reports and Settings
- Page subtitle remains visible on mobile
- Centered title and welcome text
- Removed obsolete embedded mobile patch blocks
- Standardized username/session display
- Updated service-worker cache to expense-tracker-v4-clean-ui

Installation:
1. Back up your current public folder.
2. Extract this ZIP and copy all files into public.
3. Keep your existing images folder.
4. Run: git add .
5. Run: git commit -m "Clean Expense Tracker v2 mobile UI"
6. Run: git push origin main
7. Wait for Render to deploy.
8. Remove and reinstall the mobile PWA once to clear the old service worker.

Not included because they were not uploaded in this batch: server.js, package.json, database files, and images.
