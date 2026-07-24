const CACHE_NAME = "expense-tracker-v1";

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
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
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
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                const responseCopy = response.clone();

                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseCopy);
                });

                return response;
            })
            .catch(function () {
                return caches.match(event.request);
            })
    );
});