// ==========================
// GLOBAL VARIABLES
// ==========================

let expenses = [];
let incomes = [];

let categoryData = {};
let expenseChart = null;
let incomeExpenseChart = null;
let dailySpendingChart = null;

let totalExpenses = 0;
let expenseTransactionCount = 0;

let totalIncome = 0;
let incomeTransactionCount = 0;

const userId =
    localStorage.getItem("userId");


const pesoFormatter =
    new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    );



// ==========================
// CHECK LOGIN
// ==========================

if (!userId) {

    window.location.href =
        "login.html";

}



// ==========================
// HELPER FUNCTIONS
// ==========================

function getElement(id) {

    return document.getElementById(id);

}



function formatCurrency(amount) {

    return pesoFormatter.format(
        Number(amount) || 0
    );

}



function formatDate(dateString) {

    if (!dateString) {

        return "No Date";

    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}



function setDefaultExpenseDate() {

    const expenseDate =
        getElement("expenseDate");


    if (!expenseDate) {

        return;

    }


    expenseDate.value =
        new Date()
            .toISOString()
            .split("T")[0];

}



// ==========================
// CALCULATE TOTALS
// ==========================

function calculateExpenseTotals() {

    totalExpenses =
        expenses.reduce(
            function (sum, expense) {

                return (
                    sum +
                    (
                        Number(
                            expense.amount
                        ) || 0
                    )
                );

            },
            0
        );


    expenseTransactionCount =
        expenses.length;

}



function calculateIncomeTotals() {

    totalIncome =
        incomes.reduce(
            function (sum, income) {

                return (
                    sum +
                    (
                        Number(
                            income.amount
                        ) || 0
                    )
                );

            },
            0
        );


    incomeTransactionCount =
        incomes.length;

}



// ==========================
// ADD EXPENSE
// ==========================

async function addExpense() {

    const nameInput =
        getElement("expenseName");


    const amountInput =
        getElement("expenseAmount");


    const categoryInput =
        getElement("expenseCategory");


    const dateInput =
        getElement("expenseDate");


    if (
        !nameInput ||
        !amountInput ||
        !categoryInput ||
        !dateInput
    ) {

        console.error(
            "Expense form elements were not found."
        );

        return;

    }


    const expenseName =
        nameInput.value.trim();


    const expenseAmount =
        Number(
            amountInput.value
        );


    const expenseCategory =
        categoryInput.value;


    const expenseDate =
        dateInput.value;


    if (!expenseName) {

        alert(
            "Please enter an expense name."
        );

        nameInput.focus();

        return;

    }


    if (
        !Number.isFinite(
            expenseAmount
        ) ||
        expenseAmount <= 0
    ) {

        alert(
            "Please enter a valid amount greater than zero."
        );

        amountInput.focus();

        return;

    }


    if (!expenseDate) {

        alert(
            "Please select an expense date."
        );

        dateInput.focus();

        return;

    }


    try {

        const response =
            await fetch(
                "/expenses",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        userId: userId,
                        name: expenseName,
                        category:
                            expenseCategory,
                        amount:
                            expenseAmount,
                        date:
                            expenseDate
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.success === false
        ) {

            alert(
                data.message ||
                "Unable to add expense."
            );

            return;

        }


        expenses.push(data);


        sortExpenses();

        calculateExpenseTotals();

        renderExpensePages();


        nameInput.value = "";

        amountInput.value = "";

        categoryInput.value =
            "Food";


        setDefaultExpenseDate();


        alert(
            "Expense added successfully."
        );

    } catch (error) {

        console.error(
            "Add expense error:",
            error
        );


        alert(
            "Server connection error."
        );

    }

}



// ==========================
// SORT EXPENSES
// ==========================

function sortExpenses() {

    expenses.sort(
        function (a, b) {

            const dateDifference =
                new Date(b.date) -
                new Date(a.date);


            if (dateDifference !== 0) {

                return dateDifference;

            }


            return (
                Number(b.id) -
                Number(a.id)
            );

        }
    );

}



// ==========================
// CREATE EXPENSE TABLE ROW
// ==========================

function createExpenseRow(expense) {

    const row =
        document.createElement("tr");


    const nameCell =
        document.createElement("td");


    const categoryCell =
        document.createElement("td");


    const amountCell =
        document.createElement("td");


    const dateCell =
        document.createElement("td");


    const actionCell =
        document.createElement("td");


    nameCell.textContent =
        expense.name || "Unknown";


    categoryCell.textContent =
        expense.category || "Others";


    amountCell.textContent =
        formatCurrency(
            expense.amount
        );


    dateCell.textContent =
        formatDate(
            expense.date
        );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.type =
        "button";


    deleteButton.className =
        "delete-btn";


    deleteButton.innerHTML =
        '<i class="fa-solid fa-trash"></i> Delete';


    deleteButton.addEventListener(
        "click",
        function () {

            deleteExpense(
                expense.id
            );

        }
    );


    actionCell.appendChild(
        deleteButton
    );


    row.appendChild(
        nameCell
    );


    row.appendChild(
        categoryCell
    );


    row.appendChild(
        amountCell
    );


    row.appendChild(
        dateCell
    );


    row.appendChild(
        actionCell
    );


    return row;

}



// ==========================
// DISPLAY ALL EXPENSES
// ==========================

function displayAllExpenses(
    list = expenses
) {

    const tableBody =
        getElement("expenseList");


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    if (list.length === 0) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan = 5;

        cell.className =
            "empty-table-message";


        cell.textContent =
            "No expenses found.";


        row.appendChild(cell);

        tableBody.appendChild(row);

        return;

    }


    list.forEach(
        function (expense) {

            tableBody.appendChild(
                createExpenseRow(
                    expense
                )
            );

        }
    );

}



// ==========================
// DISPLAY RECENT EXPENSES
// ==========================

function displayRecentExpenses() {

    const recentList =
        getElement(
            "recentExpenseList"
        );


    if (!recentList) {

        return;

    }


    recentList.innerHTML = "";


    const recentExpenses =
        [...expenses]
            .sort(
                function (a, b) {

                    const dateDifference =
                        new Date(b.date) -
                        new Date(a.date);


                    if (
                        dateDifference !== 0
                    ) {

                        return dateDifference;

                    }


                    return (
                        Number(b.id) -
                        Number(a.id)
                    );

                }
            )
            .slice(0, 5);


    if (
        recentExpenses.length === 0
    ) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan = 4;

        cell.className =
            "empty-table-message";


        cell.textContent =
            "No recent expenses.";


        row.appendChild(cell);

        recentList.appendChild(row);

        return;

    }


    recentExpenses.forEach(
        function (expense) {

            const row =
                document.createElement(
                    "tr"
                );


            const nameCell =
                document.createElement(
                    "td"
                );


            const categoryCell =
                document.createElement(
                    "td"
                );


            const amountCell =
                document.createElement(
                    "td"
                );


            const dateCell =
                document.createElement(
                    "td"
                );


            nameCell.textContent =
                expense.name ||
                "Unknown";


            categoryCell.textContent =
                expense.category ||
                "Others";


            amountCell.textContent =
                formatCurrency(
                    expense.amount
                );


            dateCell.textContent =
                formatDate(
                    expense.date
                );


            row.appendChild(
                nameCell
            );


            row.appendChild(
                categoryCell
            );


            row.appendChild(
                amountCell
            );


            row.appendChild(
                dateCell
            );


            recentList.appendChild(
                row
            );

        }
    );

}



// ==========================
// UPDATE DASHBOARD
// ==========================

function updateDashboard() {

    const totalExpenseElement =
        getElement("totalAmount");


    const totalIncomeElement =
        getElement("totalIncome");


    const currentBalanceElement =
        getElement(
            "currentBalance"
        );


    const transactionElement =
        getElement(
            "transactionCount"
        );


    const averageExpenseElement =
        getElement(
            "averageAmount"
        );


    const currentBalance =
        totalIncome -
        totalExpenses;


    const averageExpense =
        expenseTransactionCount > 0
            ? totalExpenses /
                expenseTransactionCount
            : 0;


    /*
        If currentBalance exists, the page
        is the main Dashboard. Show both
        income and expense transactions.

        Otherwise, the page is expenses.html,
        so show expense records only.
    */

    const displayedTransactions =
        currentBalanceElement
            ? expenseTransactionCount +
                incomeTransactionCount
            : expenseTransactionCount;


    if (totalExpenseElement) {

        totalExpenseElement.textContent =
            formatCurrency(
                totalExpenses
            );

    }


    if (totalIncomeElement) {

        totalIncomeElement.textContent =
            formatCurrency(
                totalIncome
            );

    }


    if (currentBalanceElement) {

        currentBalanceElement.textContent =
            formatCurrency(
                currentBalance
            );


        currentBalanceElement.classList.remove(
            "positive-balance",
            "negative-balance"
        );


        if (currentBalance < 0) {

            currentBalanceElement.classList.add(
                "negative-balance"
            );

        } else {

            currentBalanceElement.classList.add(
                "positive-balance"
            );

        }

    }


    if (transactionElement) {

        transactionElement.textContent =
            displayedTransactions;

    }


    if (averageExpenseElement) {

        averageExpenseElement.textContent =
            formatCurrency(
                averageExpense
            );

    }


    // Refresh the Monthly Overview cards and charts.
    updateMonthlyAnalytics();

}





// ==========================
// MONTHLY ANALYTICS
// ==========================

function parseLocalDate(dateString) {

    if (!dateString) {
        return null;
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;

}


function isDateInCurrentMonth(dateString) {

    const date = parseLocalDate(dateString);

    if (!date) {
        return false;
    }

    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth()
    );

}


function getCurrentMonthExpenses() {

    return expenses.filter(function (expense) {

        return isDateInCurrentMonth(expense.date);

    });

}


function getCurrentMonthIncomes() {

    return incomes.filter(function (income) {

        return isDateInCurrentMonth(income.date);

    });

}


function updateMonthlyAnalytics() {

    const monthlyIncomeElement =
        getElement("thisMonthIncome");

    const monthlyExpenseElement =
        getElement("thisMonthExpenses");

    const monthlyBalanceElement =
        getElement("monthlyBalance");

    const savingsRateElement =
        getElement("savingsRate");

    const largestCategoryElement =
        getElement("largestExpenseCategory");

    const largestCategoryAmountElement =
        getElement("largestExpenseCategoryAmount");

    const monthlyOverviewLabel =
        getElement("monthlyOverviewLabel");


    /*
        Stop here on pages that do not contain
        the Monthly Overview section.
    */

    if (
        !monthlyIncomeElement &&
        !monthlyExpenseElement &&
        !monthlyBalanceElement
    ) {

        return;

    }


    const currentMonthExpenses =
        getCurrentMonthExpenses();

    const currentMonthIncomes =
        getCurrentMonthIncomes();


    const monthlyIncome =
        currentMonthIncomes.reduce(
            function (sum, income) {

                return (
                    sum +
                    (
                        Number(income.amount) || 0
                    )
                );

            },
            0
        );


    const monthlyExpenses =
        currentMonthExpenses.reduce(
            function (sum, expense) {

                return (
                    sum +
                    (
                        Number(expense.amount) || 0
                    )
                );

            },
            0
        );


    const monthlyBalance =
        monthlyIncome -
        monthlyExpenses;


    const savingsRate =
        monthlyIncome > 0
            ? (
                monthlyBalance /
                monthlyIncome
            ) * 100
            : 0;


    const categoryTotals = {};


    currentMonthExpenses.forEach(
        function (expense) {

            const category =
                expense.category ||
                "Others";

            const amount =
                Number(expense.amount) || 0;

            categoryTotals[category] =
                (
                    categoryTotals[category] ||
                    0
                ) + amount;

        }
    );


    let largestCategory =
        "No expenses yet";

    let largestCategoryAmount = 0;


    Object.entries(categoryTotals)
        .forEach(
            function ([category, amount]) {

                if (
                    amount >
                    largestCategoryAmount
                ) {

                    largestCategory =
                        category;

                    largestCategoryAmount =
                        amount;

                }

            }
        );


    if (monthlyIncomeElement) {

        monthlyIncomeElement.textContent =
            formatCurrency(monthlyIncome);

    }


    if (monthlyExpenseElement) {

        monthlyExpenseElement.textContent =
            formatCurrency(monthlyExpenses);

    }


    if (monthlyBalanceElement) {

        monthlyBalanceElement.textContent =
            formatCurrency(monthlyBalance);

        monthlyBalanceElement.classList.remove(
            "positive-balance",
            "negative-balance"
        );

        monthlyBalanceElement.classList.add(
            monthlyBalance < 0
                ? "negative-balance"
                : "positive-balance"
        );

    }


    if (savingsRateElement) {

        savingsRateElement.textContent =
            `${savingsRate.toFixed(1)}%`;

        savingsRateElement.classList.remove(
            "positive-balance",
            "negative-balance"
        );

        savingsRateElement.classList.add(
            savingsRate < 0
                ? "negative-balance"
                : "positive-balance"
        );

    }


    if (largestCategoryElement) {

        largestCategoryElement.textContent =
            largestCategory;

    }


    if (largestCategoryAmountElement) {

        largestCategoryAmountElement.textContent =
            formatCurrency(
                largestCategoryAmount
            );

    }


    if (monthlyOverviewLabel) {

        monthlyOverviewLabel.textContent =
            new Date().toLocaleDateString(
                "en-PH",
                {
                    month: "long",
                    year: "numeric"
                }
            ) +
            " financial summary.";

    }


    updateIncomeExpenseChart(
        monthlyIncome,
        monthlyExpenses
    );

    updateDailySpendingChart(
        currentMonthExpenses
    );

}


function updateIncomeExpenseChart(
    monthlyIncome,
    monthlyExpenses
) {

    const canvas =
        getElement("incomeExpenseChart");


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    if (incomeExpenseChart) {

        incomeExpenseChart.destroy();

    }


    incomeExpenseChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "bar",

                data: {
                    labels: [
                        "Income",
                        "Expenses"
                    ],

                    datasets: [
                        {
                            label:
                                "Amount",

                            data: [
                                monthlyIncome,
                                monthlyExpenses
                            ],

                            backgroundColor: [
                                "rgba(46, 125, 50, 0.75)",
                                "rgba(220, 38, 38, 0.75)"
                            ],

                            borderColor: [
                                "#2e7d32",
                                "#dc2626"
                            ],

                            borderWidth: 1,

                            borderRadius: 8
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {
                        y: {
                            beginAtZero: true,

                            ticks: {
                                callback:
                                    function (value) {

                                        return (
                                            "₱" +
                                            Number(value)
                                                .toLocaleString(
                                                    "en-PH"
                                                )
                                        );

                                    }
                            }
                        }
                    },

                    plugins: {
                        legend: {
                            display: false
                        },

                        tooltip: {
                            callbacks: {
                                label:
                                    function (context) {

                                        return formatCurrency(
                                            context.raw
                                        );

                                    }
                            }
                        }
                    }
                }
            }
        );

}


function updateDailySpendingChart(
    currentMonthExpenses
) {

    const canvas =
        getElement("dailySpendingChart");


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    const today = new Date();

    const daysInMonth =
        new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
        ).getDate();


    const dailyTotals =
        Array(daysInMonth).fill(0);


    currentMonthExpenses.forEach(
        function (expense) {

            const date =
                parseLocalDate(expense.date);

            if (!date) {

                return;

            }

            const dayIndex =
                date.getDate() - 1;

            dailyTotals[dayIndex] +=
                Number(expense.amount) || 0;

        }
    );


    const labels =
        Array.from(
            {
                length: daysInMonth
            },
            function (_, index) {

                return String(index + 1);

            }
        );


    if (dailySpendingChart) {

        dailySpendingChart.destroy();

    }


    dailySpendingChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "line",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            label:
                                "Daily Expenses",

                            data:
                                dailyTotals,

                            borderColor:
                                "#2e7d32",

                            backgroundColor:
                                "rgba(46, 125, 50, 0.12)",

                            borderWidth: 3,

                            fill: true,

                            tension: 0.35,

                            pointRadius: 2,

                            pointHoverRadius: 5
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },

                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: "Day of Month"
                            }
                        },

                        y: {
                            beginAtZero: true,

                            ticks: {
                                callback:
                                    function (value) {

                                        return (
                                            "₱" +
                                            Number(value)
                                                .toLocaleString(
                                                    "en-PH"
                                                )
                                        );

                                    }
                            }
                        }
                    },

                    plugins: {
                        legend: {
                            display: false
                        },

                        tooltip: {
                            callbacks: {
                                title:
                                    function (items) {

                                        return (
                                            "Day " +
                                            items[0].label
                                        );

                                    },

                                label:
                                    function (context) {

                                        return formatCurrency(
                                            context.raw
                                        );

                                    }
                            }
                        }
                    }
                }
            }
        );

}


// ==========================
// EXPENSE CHART
// ==========================

function updateChart() {

    const canvas =
        getElement("expenseChart");


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    categoryData = {};


    expenses.forEach(
        function (expense) {

            const category =
                expense.category ||
                "Others";


            const amount =
                Number(
                    expense.amount
                ) || 0;


            if (
                categoryData[
                    category
                ]
            ) {

                categoryData[
                    category
                ] += amount;

            } else {

                categoryData[
                    category
                ] = amount;

            }

        }
    );


    let labels =
        Object.keys(
            categoryData
        );


    let values =
        Object.values(
            categoryData
        );


    const hasExpenses =
        labels.length > 0;


    if (!hasExpenses) {

        labels = [
            "No Expenses"
        ];

        values = [1];

    }


    if (expenseChart) {

        expenseChart.destroy();

    }


    expenseChart =
        new Chart(
            canvas.getContext("2d"),
            {
                type: "doughnut",

                data: {
                    labels: labels,

                    datasets: [
                        {
                            data: values,

                            backgroundColor:
                                hasExpenses
                                    ? [
                                        "#43a047",
                                        "#66bb6a",
                                        "#ffb74d",
                                        "#42a5f5",
                                        "#ab47bc",
                                        "#ef5350"
                                    ]
                                    : [
                                        "#e5e7eb"
                                    ],

                            borderWidth: 2,

                            borderColor:
                                "#ffffff",

                            hoverOffset:
                                hasExpenses
                                    ? 8
                                    : 0
                        }
                    ]
                },

                options: {
                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "65%",

                    plugins: {
                        legend: {
                            position:
                                "bottom"
                        },

                        tooltip: {
                            callbacks: {
                                label:
                                    function (
                                        context
                                    ) {

                                        if (
                                            context.label ===
                                            "No Expenses"
                                        ) {

                                            return "No expenses yet";

                                        }


                                        return (
                                            context.label +
                                            ": " +
                                            formatCurrency(
                                                context.raw
                                            )
                                        );

                                    }
                            }
                        }
                    }
                }
            }
        );

}



// ==========================
// LOAD USER EXPENSES
// ==========================

async function loadExpenses() {

    try {

        const response =
            await fetch(
                `/expenses/${userId}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load expenses."
            );

        }


        const data =
            await response.json();


        expenses =
            Array.isArray(data)
                ? data
                : [];


        sortExpenses();

        calculateExpenseTotals();

        renderExpensePages();

    } catch (error) {

        console.error(
            "Load expense error:",
            error
        );


        showExpenseLoadError();

    }

}



// ==========================
// LOAD USER INCOME
// ==========================

async function loadDashboardIncomes() {

    /*
        Only load income when the current page
        has dashboard income or balance elements.
        This prevents unnecessary requests on
        expenses.html.
    */

    const incomeElement =
        getElement("totalIncome");


    const balanceElement =
        getElement(
            "currentBalance"
        );


    if (
        !incomeElement &&
        !balanceElement
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/incomes/${userId}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load income records."
            );

        }


        const data =
            await response.json();


        incomes =
            Array.isArray(data)
                ? data
                : [];


        calculateIncomeTotals();

        updateDashboard();

    } catch (error) {

        console.error(
            "Load income error:",
            error
        );


        incomes = [];

        calculateIncomeTotals();

        updateDashboard();

    }

}



// ==========================
// EXPENSE LOAD ERROR
// ==========================

function showExpenseLoadError() {

    const expenseList =
        getElement("expenseList");


    const recentExpenseList =
        getElement(
            "recentExpenseList"
        );


    if (expenseList) {

        expenseList.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-table-message"
                >
                    Unable to load expenses.
                    Please refresh the page.
                </td>
            </tr>
        `;

    }


    if (recentExpenseList) {

        recentExpenseList.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-table-message"
                >
                    Unable to load recent expenses.
                </td>
            </tr>
        `;

    }

}



// ==========================
// SEARCH AND FILTER
// ==========================

function filterExpenses() {

    const searchInput =
        getElement(
            "searchExpense"
        );


    const categoryInput =
        getElement(
            "filterCategory"
        );


    if (
        !searchInput ||
        !categoryInput
    ) {

        return;

    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedCategory =
        categoryInput.value;


    const filteredExpenses =
        expenses.filter(
            function (expense) {

                const expenseName =
                    String(
                        expense.name ||
                        ""
                    )
                    .toLowerCase();


                const expenseCategory =
                    String(
                        expense.category ||
                        ""
                    )
                    .toLowerCase();


                const nameMatches =
                    expenseName.includes(
                        search
                    );


                const categorySearchMatches =
                    expenseCategory.includes(
                        search
                    );


                const selectedCategoryMatches =
                    selectedCategory ===
                        "All" ||
                    expense.category ===
                        selectedCategory;


                return (
                    (
                        nameMatches ||
                        categorySearchMatches
                    ) &&
                    selectedCategoryMatches
                );

            }
        );


    displayAllExpenses(
        filteredExpenses
    );

}



// ==========================
// DELETE EXPENSE
// ==========================

async function deleteExpense(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this expense?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/expenses/${id}/${userId}`,
                {
                    method:
                        "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.success === false
        ) {

            alert(
                data.message ||
                "Unable to delete expense."
            );

            return;

        }


        expenses =
            expenses.filter(
                function (expense) {

                    return (
                        Number(
                            expense.id
                        ) !==
                        Number(id)
                    );

                }
            );


        calculateExpenseTotals();

        renderExpensePages();

    } catch (error) {

        console.error(
            "Delete expense error:",
            error
        );


        alert(
            "Unable to delete expense."
        );

    }

}



// ==========================
// RENDER EXPENSE PAGES
// ==========================

function renderExpensePages() {

    displayAllExpenses();

    displayRecentExpenses();

    updateDashboard();

    updateChart();

}



// ==========================
// START APP
// ==========================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        setDefaultExpenseDate();


        /*
            Load expenses first because they are
            required on both index.html and
            expenses.html.
        */

        await loadExpenses();


        /*
            Income is loaded only when Dashboard
            income elements exist.
        */

        await loadDashboardIncomes();

    }
);