"use strict";

/* =========================================================
   EXPENSE TRACKER — GLOBAL THEME
   Load this file on every HTML page.
========================================================= */

(function () {
    const STORAGE_KEY = "expenseTrackerTheme";
    const systemTheme = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

    function getTheme() {
        const savedTheme =
            localStorage.getItem(STORAGE_KEY);

        if (
            savedTheme === "light" ||
            savedTheme === "dark" ||
            savedTheme === "system"
        ) {
            return savedTheme;
        }

        return "light";
    }

    function useDarkMode(theme) {
        return (
            theme === "dark" ||
            (
                theme === "system" &&
                systemTheme.matches
            )
        );
    }

    function updateThemeColor(isDark) {
        const themeColor =
            document.querySelector(
                'meta[name="theme-color"]'
            );

        if (themeColor) {
            themeColor.setAttribute(
                "content",
                isDark ? "#101a14" : "#2e7d32"
            );
        }
    }

    function applyTheme() {
        const dark =
            useDarkMode(getTheme());

        document.documentElement.classList.toggle(
            "dark-mode",
            dark
        );

        if (document.body) {
            document.body.classList.toggle(
                "dark-mode",
                dark
            );
        }

        document.documentElement.dataset.theme =
            dark ? "dark" : "light";

        updateThemeColor(dark);

        window.dispatchEvent(
            new CustomEvent(
                "expenseTrackerThemeChanged",
                {
                    detail: {
                        darkMode: dark,
                        theme: getTheme()
                    }
                }
            )
        );
    }

    /* Apply to <html> immediately to reduce theme flashing. */
    applyTheme();

    document.addEventListener(
        "DOMContentLoaded",
        applyTheme
    );

    window.addEventListener(
        "storage",
        function (event) {
            if (event.key === STORAGE_KEY) {
                applyTheme();
            }
        }
    );

    function handleSystemThemeChange() {
        if (getTheme() === "system") {
            applyTheme();
        }
    }

    if (
        typeof systemTheme.addEventListener ===
        "function"
    ) {
        systemTheme.addEventListener(
            "change",
            handleSystemThemeChange
        );
    } else if (
        typeof systemTheme.addListener ===
        "function"
    ) {
        systemTheme.addListener(
            handleSystemThemeChange
        );
    }

    window.applyExpenseTrackerTheme =
        applyTheme;
})();
