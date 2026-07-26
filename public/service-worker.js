const CACHE_NAME = "expense-tracker-v5-mobile-header";

const APP_FILES = [
    "/",
    "/login.html",
    "/register.html",
    "/index.html",
    "/expenses.html",
    "/income.html",
    "/reports.html",
    "/settings.html",
    "/style.css",
    "/theme.js",
    "/script.js",
    "/income.js",
    "/reports.js",
    "/settings.js",
    "/manifest.json",
    "/images/icon-192.png",
    "/images/icon-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(APP_FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names
                    .filter(function (name) {
                        return name !== CACHE_NAME;
                    })
                    .map(function (name) {
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function (event) {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // Never cache API calls as page assets.
    if (
        url.origin === self.location.origin &&
        (
            url.pathname.startsWith("/expenses/") ||
            url.pathname.startsWith("/incomes/") ||
            url.pathname === "/login" ||
            url.pathname === "/register" ||
            url.pathname === "/profile"
        )
    ) {
        return;
    }

    // HTML: use network first so deployments update immediately,
    // with cached fallback for offline use.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(function (response) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, copy);
                    });
                    return response;
                })
                .catch(function () {
                    return caches.match(request)
                        .then(function (cached) {
                            return cached || caches.match("/login.html");
                        });
                })
        );
        return;
    }

    // CSS/JS/images: cache first for instant rendering, then refresh cache.
    event.respondWith(
        caches.match(request).then(function (cached) {
            const network = fetch(request)
                .then(function (response) {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(function (cache) {
                            cache.put(request, copy);
                        });
                    }
                    return response;
                })
                .catch(function () {
                    return cached;
                });

            return cached || network;
        })
    );
});