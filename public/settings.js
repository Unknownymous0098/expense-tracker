"use strict";



const settingsUserId =
    localStorage.getItem("userId");



if (!settingsUserId) {

    window.location.href =
        "login.html";

}





// ==========================
// DISPLAY MESSAGE
// ==========================

function showSettingsMessage(
    message,
    type = "success"
) {


    const messageBox =
        document.getElementById(
            "settingsMessage"
        );


    if (!messageBox) {

        return;

    }


    messageBox.textContent =
        message;


    messageBox.className =

        "settings-message " +

        type;


    window.clearTimeout(
        showSettingsMessage.timeout
    );


    showSettingsMessage.timeout =
        window.setTimeout(
            function () {

                messageBox.className =
                    "settings-message";

                messageBox.textContent =
                    "";

            },
            3500
        );

}





// ==========================
// LOAD SETTINGS
// ==========================

function loadSettings() {


    const username =
        localStorage.getItem(
            "username"
        ) || "User";


    const theme =
        localStorage.getItem(
            "expenseTrackerTheme"
        ) || "light";


    const currency =
        localStorage.getItem(
            "expenseTrackerCurrency"
        ) || "PHP";


    const monthlyBudget =
        localStorage.getItem(
            "expenseTrackerMonthlyBudget"
        ) || "";


    const budgetWarning =
        localStorage.getItem(
            "expenseTrackerBudgetWarning"
        );


    const deleteConfirmation =
        localStorage.getItem(
            "expenseTrackerDeleteConfirmation"
        );



    setSettingsText(
        "welcomeUser",
        "Welcome, " + username
    );


    setSettingsText(
        "sidebarUsername",
        username
    );


    const usernameInput =
        document.getElementById(
            "settingsUsername"
        );


    const userIdInput =
        document.getElementById(
            "settingsUserId"
        );


    const currencyInput =
        document.getElementById(
            "settingsCurrency"
        );


    const budgetInput =
        document.getElementById(
            "settingsMonthlyBudget"
        );


    if (usernameInput) {

        usernameInput.value =
            username;

    }


    if (userIdInput) {

        userIdInput.value =
            settingsUserId;

    }


    if (currencyInput) {

        currencyInput.value =
            currency;

    }


    if (budgetInput) {

        budgetInput.value =
            monthlyBudget;

    }



    const themeInput =
        document.querySelector(
            `input[name="appTheme"][value="${theme}"]`
        );


    if (themeInput) {

        themeInput.checked =
            true;

    }



    const budgetWarningInput =
        document.getElementById(
            "budgetWarningSetting"
        );


    const deleteConfirmationInput =
        document.getElementById(
            "deleteConfirmationSetting"
        );


    if (budgetWarningInput) {

        budgetWarningInput.checked =

            budgetWarning === null

                ? true

                : budgetWarning ===
                    "true";

    }


    if (deleteConfirmationInput) {

        deleteConfirmationInput.checked =

            deleteConfirmation === null

                ? true

                : deleteConfirmation ===
                    "true";

    }



    setSettingsText(
        "aboutCurrency",
        currency
    );


    applyStoredTheme();

}





// ==========================
// SAVE PROFILE
// ==========================

async function saveProfileSettings(event) {
    event.preventDefault();

    const usernameInput =
        document.getElementById("settingsUsername");

    const newUsername =
        usernameInput.value.trim();

    if (newUsername.length < 2) {
        showSettingsMessage(
            "Display name must contain at least 2 characters.",
            "error"
        );

        return;
    }

    try {
        const response = await fetch("/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: Number(settingsUserId),
                username: newUsername
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to update your profile."
            );
        }

        localStorage.setItem(
            "username",
            result.username
        );

        setSettingsText(
            "welcomeUser",
            "Welcome, " + result.username
        );

        setSettingsText(
            "sidebarUsername",
            result.username
        );

        showSettingsMessage(
            result.message
        );
    } catch (error) {
        console.error(
            "Profile update error:",
            error
        );

        showSettingsMessage(
            error.message ||
            "Unable to update your profile.",
            "error"
        );
    }
}

// ==========================
// SAVE FINANCIAL SETTINGS
// ==========================

function saveFinancialSettings(event) {


    event.preventDefault();


    const currency =
        document.getElementById(
            "settingsCurrency"
        ).value;


    const budgetValue =
        document.getElementById(
            "settingsMonthlyBudget"
        ).value;


    const budget =
        Number(budgetValue);



    if (
        budgetValue &&
        (
            Number.isNaN(budget) ||
            budget < 0
        )
    ) {

        showSettingsMessage(

            "Please enter a valid monthly budget.",

            "error"

        );


        return;

    }



    localStorage.setItem(

        "expenseTrackerCurrency",

        currency

    );


    localStorage.setItem(

        "expenseTrackerMonthlyBudget",

        budgetValue

    );


    setSettingsText(

        "aboutCurrency",

        currency

    );


    showSettingsMessage(

        "Financial preferences saved successfully."

    );

}





// ==========================
// SAVE APPLICATION OPTIONS
// ==========================

function saveApplicationOptions() {


    const budgetWarning =
        document.getElementById(
            "budgetWarningSetting"
        ).checked;


    const deleteConfirmation =
        document.getElementById(
            "deleteConfirmationSetting"
        ).checked;



    localStorage.setItem(

        "expenseTrackerBudgetWarning",

        budgetWarning

    );


    localStorage.setItem(

        "expenseTrackerDeleteConfirmation",

        deleteConfirmation

    );


    showSettingsMessage(

        "Application options updated."

    );

}





// ==========================
// THEME
// ==========================

function saveThemeSetting() {


    const selectedTheme =
        document.querySelector(
            'input[name="appTheme"]:checked'
        );


    if (!selectedTheme) {

        return;

    }


    localStorage.setItem(

        "expenseTrackerTheme",

        selectedTheme.value

    );


    applyStoredTheme();


    showSettingsMessage(

        "Appearance setting updated."

    );

}



function applyStoredTheme() {


    const theme =
        localStorage.getItem(
            "expenseTrackerTheme"
        ) || "light";


    let useDarkMode =
        false;



    if (theme === "dark") {

        useDarkMode =
            true;

    }



    if (theme === "system") {

        useDarkMode =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

    }



    document.body.classList.toggle(

        "dark-mode",

        useDarkMode

    );

}





// ==========================
// EXPORT ALL DATA
// ==========================

async function exportAllSettingsData(event) {


    const exportButton =
        event?.currentTarget;


    if (exportButton) {

        exportButton.disabled =
            true;

        exportButton.innerHTML =

            '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';

    }



    try {


        const responses =
            await Promise.all([

                fetch(
                    `/expenses/${settingsUserId}`
                ),

                fetch(
                    `/incomes/${settingsUserId}`
                )

            ]);



        if (
            !responses[0].ok ||
            !responses[1].ok
        ) {

            throw new Error(
                "Unable to retrieve records."
            );

        }



        const expensesData =
            await responses[0].json();


        const incomesData =
            await responses[1].json();



        const expenses =
            getSettingsRecordArray(
                expensesData,
                "expenses"
            );


        const incomes =
            getSettingsRecordArray(
                incomesData,
                "incomes"
            );



        const rows = [

            [
                "Type",
                "Name or Source",
                "Category",
                "Amount",
                "Date"
            ]

        ];



        incomes.forEach(
            function (income) {


                rows.push([

                    "Income",

                    income.source ||
                    income.name ||
                    "Income",

                    income.category ||
                    "Income",

                    Number(
                        income.amount
                    ).toFixed(2),

                    income.date || ""

                ]);

            }
        );



        expenses.forEach(
            function (expense) {


                rows.push([

                    "Expense",

                    expense.name ||
                    "Expense",

                    expense.category ||
                    "Others",

                    Number(
                        expense.amount
                    ).toFixed(2),

                    expense.date || ""

                ]);

            }
        );



        if (
            rows.length === 1
        ) {

            showSettingsMessage(

                "There are no records to export.",

                "error"

            );


            return;

        }



        const csvContent =
            rows

                .map(
                    function (row) {

                        return row

                            .map(
                                settingsCSVCell
                            )

                            .join(",");

                    }
                )

                .join("\n");



        const file =
            new Blob(

                [
                    "\uFEFF" +
                    csvContent
                ],

                {
                    type:
                        "text/csv;charset=utf-8;"
                }

            );



        const url =
            URL.createObjectURL(
                file
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =

            "expense-tracker-backup-" +

            getSettingsDateString() +

            ".csv";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        showSettingsMessage(

            "Your data was exported successfully."

        );


    } catch (error) {


        console.error(

            "Export failed:",

            error

        );


        showSettingsMessage(

            "Unable to export your data. Make sure the server is running.",

            "error"

        );


    } finally {


        if (exportButton) {

            exportButton.disabled =
                false;


            exportButton.innerHTML =

                '<i class="fa-solid fa-download"></i> Export Data';

        }

    }

}





// ==========================
// GET RESPONSE ARRAY
// ==========================

function getSettingsRecordArray(
    data,
    propertyName
) {


    if (Array.isArray(data)) {

        return data;

    }


    if (
        data &&
        Array.isArray(
            data[propertyName]
        )
    ) {

        return data[propertyName];

    }


    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(data.records)
    ) {

        return data.records;

    }


    return [];

}





// ==========================
// CSV HELPERS
// ==========================

function settingsCSVCell(value) {


    const text =
        String(
            value ?? ""
        );


    return (

        '"' +

        text.replaceAll(
            '"',
            '""'
        ) +

        '"'

    );

}



function getSettingsDateString() {


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    return (

        year +

        "-" +

        month +

        "-" +

        day

    );

}





// ==========================
// SIDEBAR
// ==========================

function openSidebar() {


    document.getElementById(
        "sidebar"
    ).classList.add(
        "active"
    );


    document.getElementById(
        "overlay"
    ).classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}



function closeSidebar() {


    document.getElementById(
        "sidebar"
    ).classList.remove(
        "active"
    );


    document.getElementById(
        "overlay"
    ).classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}





// ==========================
// ACTIVE PAGE
// ==========================

function highlightSettingsPage() {


    const currentPage =
        window.location.pathname

            .split("/")

            .pop() ||

        "settings.html";



    document.querySelectorAll(
        ".menu-link"
    ).forEach(
        function (link) {


            link.classList.toggle(

                "active-page",

                link.getAttribute(
                    "href"
                ) === currentPage

            );

        }
    );

}





// ==========================
// LOGOUT
// ==========================

function logout() {


    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {

        return;

    }


    localStorage.removeItem(
        "userId"
    );


    localStorage.removeItem(
        "username"
    );


    window.location.href =
        "login.html";

}







// ==========================
// DELETE ACCOUNT
// ==========================

async function deleteAccount(event) {

    const deleteButton =
        event?.currentTarget;

    const passwordInput =
        document.getElementById(
            "deleteAccountPassword"
        );

    const password =
        passwordInput?.value || "";

    if (!password) {

        showSettingsMessage(
            "Enter your password before deleting your account.",
            "error"
        );

        passwordInput?.focus();

        return;
    }

    const firstConfirmation =
        confirm(
            "Delete your account permanently? All income and expense records will be removed."
        );

    if (!firstConfirmation) {
        return;
    }

    const finalConfirmation =
        confirm(
            "This action cannot be undone. Continue with permanent account deletion?"
        );

    if (!finalConfirmation) {
        return;
    }

    if (deleteButton) {

        deleteButton.disabled = true;

        deleteButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

    }

    try {

        const response =
            await fetch(
                "/delete-account",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        userId: settingsUserId,
                        password
                    })
                }
            );

        let data = {};

        try {
            data = await response.json();
        }
        catch {
            data = {};
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to delete your account."
            );

        }

        localStorage.clear();

        alert(
            "Your account and all financial records were deleted."
        );

        window.location.replace(
            "register.html"
        );

    }
    catch (error) {

        showSettingsMessage(
            error.message === "Failed to fetch"
                ? "Unable to connect to the server."
                : error.message,
            "error"
        );

        if (deleteButton) {

            deleteButton.disabled = false;

            deleteButton.innerHTML =
                '<i class="fa-solid fa-user-xmark"></i> Delete Account';

        }

    }

}


// ==========================
// HELPER
// ==========================

function setSettingsText(
    id,
    value
) {


    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}





// ==========================
// EVENTS
// ==========================

document.addEventListener(
    "keydown",
    function (event) {


        if (
            event.key ===
            "Escape"
        ) {

            closeSidebar();

        }

    }
);



window
    .matchMedia(
        "(prefers-color-scheme: dark)"
    )
    .addEventListener(
        "change",
        function () {


            const savedTheme =
                localStorage.getItem(
                    "expenseTrackerTheme"
                );


            if (
                savedTheme ===
                "system"
            ) {

                applyStoredTheme();

            }

        }
    );





// ==========================
// LOAD PAGE
// ==========================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        highlightSettingsPage();


        loadSettings();

    }
);