EXPENSE TRACKER — FINAL DARK-MODE FLASH FIX

WHAT CHANGED
1. Dark mode is applied to <html> before the external stylesheet loads.
2. Every CSS selector using body.dark-mode now also reacts immediately
   through html.dark-mode body.
3. theme.js is cached and loaded consistently on every page.
4. The service-worker cache version is now v3, forcing old cached files out.
5. Static asset cache headers were improved in server.js.
6. Navigation animations are disabled while leaving a page to prevent a
   bright transitional frame.

INSTALL
1. Back up your existing project.
2. Copy server.js and package.json to the project root.
3. Copy everything inside this ZIP's public folder into your project's
   public folder and replace matching files.
4. Run:
      git add .
      git commit -m "Fix persistent dark mode flashing"
      git push origin main
5. Wait for Render to finish deploying.
6. Open the deployed site and press Ctrl+Shift+R once.
7. If an old PWA cache remains:
      DevTools > Application > Service Workers > Unregister
      DevTools > Application > Storage > Clear site data
   Then reload once.

IMPORTANT
Do not delete your database folder. This ZIP does not include or replace it.
