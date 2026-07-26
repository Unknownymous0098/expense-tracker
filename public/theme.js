"use strict";

(function () {
    const STORAGE_KEY = "expenseTrackerTheme";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    function getTheme() {
        const value = localStorage.getItem(STORAGE_KEY);
        return ["light", "dark", "system"].includes(value)
            ? value
            : "light";
    }

    function shouldUseDark(theme) {
        return theme === "dark" ||
            (theme === "system" && systemTheme.matches);
    }

    function updateThemeColor(dark) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute("content", dark ? "#0b120e" : "#2e7d32");
        }
    }

    function applyTheme() {
        const theme = getTheme();
        const dark = shouldUseDark(theme);
        const root = document.documentElement;

        root.classList.toggle("dark-mode", dark);
        root.dataset.theme = dark ? "dark" : "light";
        root.style.backgroundColor = dark ? "#0b120e" : "#eef8f0";
        root.style.colorScheme = dark ? "dark" : "light";

        if (document.body) {
            document.body.classList.toggle("dark-mode", dark);
        }

        updateThemeColor(dark);

        window.dispatchEvent(new CustomEvent(
            "expenseTrackerThemeChanged",
            { detail: { darkMode: dark, theme } }
        ));
    }

    // Prevent animated light remnants while leaving the current document.
    document.addEventListener("click", function (event) {
        const link = event.target.closest("a[href]");
        if (!link) return;

        const url = new URL(link.href, location.href);
        if (
            url.origin === location.origin &&
            url.pathname !== location.pathname &&
            !link.hasAttribute("download") &&
            link.target !== "_blank"
        ) {
            document.documentElement.classList.add("is-navigating");
        }
    });

    window.addEventListener("pageshow", function () {
        document.documentElement.classList.remove("is-navigating");
        applyTheme();
    });

    document.addEventListener("DOMContentLoaded", applyTheme);
    window.addEventListener("storage", function (event) {
        if (event.key === STORAGE_KEY) applyTheme();
    });

    const onSystemChange = function () {
        if (getTheme() === "system") applyTheme();
    };

    if (systemTheme.addEventListener) {
        systemTheme.addEventListener("change", onSystemChange);
    } else if (systemTheme.addListener) {
        systemTheme.addListener(onSystemChange);
    }

    window.applyExpenseTrackerTheme = applyTheme;
    applyTheme();
})();