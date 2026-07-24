"use strict";



let reportExpenses = [];

let reportIncomes = [];

let filteredReportTransactions = [];



let reportIncomeExpenseChart = null;

let reportCategoryChart = null;

let reportMonthlyChart = null;



const reportUserId =
    localStorage.getItem("userId");



if (!reportUserId) {

    window.location.href =
        "login.html";

}



const reportCurrencyFormatter =
    new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP"
        }
    );





// ==========================
// FORMAT CURRENCY
// ==========================

function formatReportCurrency(value) {

    return reportCurrencyFormatter.format(
        Number(value) || 0
    );

}





// ==========================
// PARSE DATE
// ==========================

function parseReportDate(value) {

    if (!value) {

        return null;

    }


    const text =
        String(value).trim();



    const isoDate =
        text.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})/
        );


    if (isoDate) {

        return new Date(
            Number(isoDate[1]),
            Number(isoDate[2]) - 1,
            Number(isoDate[3])
        );

    }



    const slashDate =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (slashDate) {

        return new Date(
            Number(slashDate[3]),
            Number(slashDate[1]) - 1,
            Number(slashDate[2])
        );

    }



    const parsedDate =
        new Date(text);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return null;

    }


    return parsedDate;

}





// ==========================
// FORMAT DATE
// ==========================

function formatReportDate(value) {

    const date =
        parseReportDate(value);


    if (!date) {

        return value || "No date";

    }


    return date.toLocaleDateString(
        "en-PH",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}





// ==========================
// DATE INPUT FORMAT
// ==========================

function dateToInputValue(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}





// ==========================
// NORMALIZE RECORDS
// ==========================

function normalizeReportRecords(
    records,
    type
) {

    if (!Array.isArray(records)) {

        return [];

    }


    return records.map(
        function (record) {


            let recordName;


            if (type === "income") {

                recordName =
                    record.source ||
                    record.name ||
                    record.incomeSource ||
                    "Income";

            } else {

                recordName =
                    record.name ||
                    record.expenseName ||
                    "Expense";

            }


            return {

                id:
                    record.id,

                type:
                    type,

                name:
                    recordName,

                category:
                    record.category ||
                    "Others",

                amount:
                    Number(
                        record.amount
                    ) || 0,

                date:
                    record.date || ""

            };

        }
    );

}





// ==========================
// GET RECORD ARRAY
// ==========================

function getResponseRecords(data) {

    if (Array.isArray(data)) {

        return data;

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


    if (
        data &&
        Array.isArray(data.expenses)
    ) {

        return data.expenses;

    }


    if (
        data &&
        Array.isArray(data.incomes)
    ) {

        return data.incomes;

    }


    return [];

}





// ==========================
// FETCH ENDPOINT
// ==========================

async function fetchReportEndpoint(url) {

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Request failed: " +
            response.status
        );

    }


    return response.json();

}





// ==========================
// LOAD REPORT DATA
// ==========================

async function loadReportData() {

    try {


        const responses =
            await Promise.all([

                fetchReportEndpoint(
                    `/expenses/${reportUserId}`
                ),

                fetchReportEndpoint(
                    `/incomes/${reportUserId}`
                )

            ]);



        reportExpenses =
            normalizeReportRecords(
                getResponseRecords(
                    responses[0]
                ),
                "expense"
            );



        reportIncomes =
            normalizeReportRecords(
                getResponseRecords(
                    responses[1]
                ),
                "income"
            );



        setDefaultReportDates();


        applyReportFilters();


    } catch (error) {


        console.error(
            "Unable to load reports:",
            error
        );


        const tableBody =
            document.getElementById(
                "reportTransactionList"
            );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="report-empty-state"
                    >

                        Unable to load report data.

                        Make sure your server is running.

                    </td>

                </tr>

            `;

        }

    }

}





// ==========================
// DEFAULT DATE RANGE
// ==========================

function setDefaultReportDates() {


    const allTransactions = [

        ...reportExpenses,

        ...reportIncomes

    ];



    const validDates =
        allTransactions

            .map(
                function (transaction) {

                    return parseReportDate(
                        transaction.date
                    );

                }
            )

            .filter(
                function (date) {

                    return date !== null;

                }
            )

            .sort(
                function (dateA, dateB) {

                    return dateA - dateB;

                }
            );



    if (validDates.length === 0) {

        return;

    }



    const startDateInput =
        document.getElementById(
            "reportStartDate"
        );


    const endDateInput =
        document.getElementById(
            "reportEndDate"
        );



    if (
        startDateInput &&
        !startDateInput.value
    ) {

        startDateInput.value =
            dateToInputValue(
                validDates[0]
            );

    }



    if (
        endDateInput &&
        !endDateInput.value
    ) {

        endDateInput.value =
            dateToInputValue(
                validDates[
                    validDates.length - 1
                ]
            );

    }

}





// ==========================
// APPLY FILTERS
// ==========================

function applyReportFilters() {


    const startDateValue =
        document.getElementById(
            "reportStartDate"
        ).value;


    const endDateValue =
        document.getElementById(
            "reportEndDate"
        ).value;


    const selectedType =
        document.getElementById(
            "reportType"
        ).value;



    const startDate =
        startDateValue
            ? parseReportDate(
                startDateValue
            )
            : null;


    const endDate =
        endDateValue
            ? parseReportDate(
                endDateValue
            )
            : null;



    if (endDate) {

        endDate.setHours(
            23,
            59,
            59,
            999
        );

    }



    filteredReportTransactions = [

        ...reportIncomes,

        ...reportExpenses

    ];


    filteredReportTransactions =
        filteredReportTransactions.filter(
            function (transaction) {


                if (
                    selectedType !== "all" &&
                    transaction.type !==
                        selectedType
                ) {

                    return false;

                }



                const transactionDate =
                    parseReportDate(
                        transaction.date
                    );


                if (
                    startDate &&
                    (
                        !transactionDate ||
                        transactionDate <
                            startDate
                    )
                ) {

                    return false;

                }



                if (
                    endDate &&
                    (
                        !transactionDate ||
                        transactionDate >
                            endDate
                    )
                ) {

                    return false;

                }


                return true;

            }
        );



    filteredReportTransactions.sort(
        function (
            transactionA,
            transactionB
        ) {


            const dateA =
                parseReportDate(
                    transactionA.date
                );


            const dateB =
                parseReportDate(
                    transactionB.date
                );


            return (
                (
                    dateB
                        ? dateB.getTime()
                        : 0
                ) -
                (
                    dateA
                        ? dateA.getTime()
                        : 0
                )
            );

        }
    );



    updateReportPeriodLabel(

        startDateValue,

        endDateValue,

        selectedType

    );


    updateReportSummary();

    updateReportCharts();

    renderReportTransactions();

}





// ==========================
// RESET FILTERS
// ==========================

function resetReportFilters() {


    document.getElementById(
        "reportStartDate"
    ).value = "";


    document.getElementById(
        "reportEndDate"
    ).value = "";


    document.getElementById(
        "reportType"
    ).value = "all";


    setDefaultReportDates();


    applyReportFilters();

}





// ==========================
// PERIOD LABEL
// ==========================

function updateReportPeriodLabel(

    startDateValue,

    endDateValue,

    selectedType

) {


    const periodLabel =
        document.getElementById(
            "reportPeriodLabel"
        );


    let periodText =
        "all available dates";



    if (
        startDateValue &&
        endDateValue
    ) {

        periodText =

            formatReportDate(
                startDateValue
            ) +

            " to " +

            formatReportDate(
                endDateValue
            );

    } else if (startDateValue) {

        periodText =

            "from " +

            formatReportDate(
                startDateValue
            );

    } else if (endDateValue) {

        periodText =

            "up to " +

            formatReportDate(
                endDateValue
            );

    }



    let typeText =
        "all transactions";


    if (
        selectedType === "income"
    ) {

        typeText =
            "income";

    }


    if (
        selectedType === "expense"
    ) {

        typeText =
            "expenses";

    }



    periodLabel.textContent =

        "Showing " +

        typeText +

        " for " +

        periodText;

}





// ==========================
// SUMMARY
// ==========================

function updateReportSummary() {


    let totalIncome = 0;

    let totalExpenses = 0;



    filteredReportTransactions.forEach(
        function (transaction) {


            if (
                transaction.type ===
                "income"
            ) {

                totalIncome +=
                    transaction.amount;

            } else {

                totalExpenses +=
                    transaction.amount;

            }

        }
    );



    const balance =
        totalIncome -
        totalExpenses;



    const savingsRate =
        totalIncome > 0

            ? (
                balance /
                totalIncome
            ) * 100

            : 0;



    document.getElementById(
        "reportTotalIncome"
    ).textContent =
        formatReportCurrency(
            totalIncome
        );



    document.getElementById(
        "reportTotalExpenses"
    ).textContent =
        formatReportCurrency(
            totalExpenses
        );



    const balanceElement =
        document.getElementById(
            "reportBalance"
        );


    balanceElement.textContent =
        formatReportCurrency(
            balance
        );


    balanceElement.classList.toggle(

        "report-positive",

        balance >= 0

    );


    balanceElement.classList.toggle(

        "report-negative",

        balance < 0

    );



    document.getElementById(
        "reportSavingsRate"
    ).textContent =

        savingsRate.toFixed(1) +

        "%";

}





// ==========================
// UPDATE ALL CHARTS
// ==========================

function updateReportCharts() {


    const incomes =
        filteredReportTransactions.filter(
            function (transaction) {

                return (
                    transaction.type ===
                    "income"
                );

            }
        );


    const expenses =
        filteredReportTransactions.filter(
            function (transaction) {

                return (
                    transaction.type ===
                    "expense"
                );

            }
        );


    updateIncomeExpenseReportChart(

        incomes,

        expenses

    );


    updateCategoryReportChart(

        expenses

    );


    updateMonthlyReportChart(

        incomes,

        expenses

    );

}





// ==========================
// INCOME VS EXPENSE CHART
// ==========================

function updateIncomeExpenseReportChart(

    incomes,

    expenses

) {


    const canvas =
        document.getElementById(
            "reportIncomeExpenseChart"
        );


    const totalIncome =
        incomes.reduce(
            function (total, income) {

                return (
                    total +
                    income.amount
                );

            },
            0
        );


    const totalExpenses =
        expenses.reduce(
            function (total, expense) {

                return (
                    total +
                    expense.amount
                );

            },
            0
        );



    if (reportIncomeExpenseChart) {

        reportIncomeExpenseChart.destroy();

    }



    reportIncomeExpenseChart =
        new Chart(
            canvas,
            {

                type: "bar",


                data: {

                    labels: [

                        "Income",

                        "Expenses"

                    ],


                    datasets: [

                        {

                            data: [

                                totalIncome,

                                totalExpenses

                            ],


                            backgroundColor: [

                                "rgba(46,125,50,0.75)",

                                "rgba(220,38,38,0.75)"

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


                    plugins: {

                        legend: {

                            display: false

                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function (context) {

                                        return formatReportCurrency(
                                            context.raw
                                        );

                                    }

                            }

                        }

                    },


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

                    }

                }

            }
        );

}





// ==========================
// CATEGORY CHART
// ==========================

function updateCategoryReportChart(
    expenses
) {


    const categoryTotals = {};



    expenses.forEach(
        function (expense) {


            const category =
                expense.category ||
                "Others";


            categoryTotals[category] =
                (
                    categoryTotals[
                        category
                    ] || 0
                ) +
                expense.amount;

        }
    );



    let labels =
        Object.keys(
            categoryTotals
        );


    let values =
        Object.values(
            categoryTotals
        );


    const hasExpenses =
        labels.length > 0;



    if (!hasExpenses) {

        labels = [
            "No Expenses"
        ];

        values = [
            1
        ];

    }



    if (reportCategoryChart) {

        reportCategoryChart.destroy();

    }



    reportCategoryChart =
        new Chart(

            document.getElementById(
                "reportCategoryChart"
            ),

            {

                type:
                    "doughnut",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            data:
                                values,


                            backgroundColor:

                                hasExpenses

                                    ? [

                                        "#43a047",

                                        "#66bb6a",

                                        "#42a5f5",

                                        "#ffb74d",

                                        "#ab47bc",

                                        "#ef5350"

                                    ]

                                    : [

                                        "#e5e7eb"

                                    ],


                            borderColor:
                                "#ffffff",


                            borderWidth:
                                2

                        }

                    ]

                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    cutout:
                        "62%",


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

                                            return (
                                                "No expenses found"
                                            );

                                        }


                                        return (

                                            context.label +

                                            ": " +

                                            formatReportCurrency(
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
// MONTHLY TREND CHART
// ==========================

function updateMonthlyReportChart(

    incomes,

    expenses

) {


    const monthKeys =
        new Set();



    [

        ...incomes,

        ...expenses

    ].forEach(
        function (transaction) {


            const date =
                parseReportDate(
                    transaction.date
                );


            if (!date) {

                return;

            }


            const monthKey =

                date.getFullYear() +

                "-" +

                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            monthKeys.add(
                monthKey
            );

        }
    );



    const sortedMonths =
        Array.from(
            monthKeys
        ).sort();



    const labels =
        sortedMonths.map(
            function (monthKey) {


                const parts =
                    monthKey.split("-");


                const date =
                    new Date(

                        Number(parts[0]),

                        Number(parts[1]) - 1,

                        1

                    );


                return date.toLocaleDateString(
                    "en-PH",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );

            }
        );



    const incomeValues =
        getMonthlyValues(

            incomes,

            sortedMonths

        );


    const expenseValues =
        getMonthlyValues(

            expenses,

            sortedMonths

        );



    if (sortedMonths.length === 0) {

        labels.push(
            "No Data"
        );


        incomeValues.push(
            0
        );


        expenseValues.push(
            0
        );

    }



    if (reportMonthlyChart) {

        reportMonthlyChart.destroy();

    }



    reportMonthlyChart =
        new Chart(

            document.getElementById(
                "reportMonthlyChart"
            ),

            {

                type:
                    "line",


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                "Income",


                            data:
                                incomeValues,


                            borderColor:
                                "#2e7d32",


                            backgroundColor:
                                "rgba(46,125,50,0.12)",


                            borderWidth:
                                3,


                            tension:
                                0.35

                        },


                        {

                            label:
                                "Expenses",


                            data:
                                expenseValues,


                            borderColor:
                                "#dc2626",


                            backgroundColor:
                                "rgba(220,38,38,0.10)",


                            borderWidth:
                                3,


                            tension:
                                0.35

                        }

                    ]

                },


                options: {

                    responsive:
                        true,


                    maintainAspectRatio:
                        false,


                    interaction: {

                        intersect:
                            false,


                        mode:
                            "index"

                    },


                    plugins: {

                        tooltip: {

                            callbacks: {

                                label:
                                    function (
                                        context
                                    ) {

                                        return (

                                            context.dataset.label +

                                            ": " +

                                            formatReportCurrency(
                                                context.raw
                                            )

                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        y: {

                            beginAtZero:
                                true,


                            ticks: {

                                callback:
                                    function (
                                        value
                                    ) {

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

                    }

                }

            }

        );

}





// ==========================
// MONTHLY VALUES
// ==========================

function getMonthlyValues(

    transactions,

    monthKeys

) {


    const monthlyTotals = {};



    transactions.forEach(
        function (transaction) {


            const date =
                parseReportDate(
                    transaction.date
                );


            if (!date) {

                return;

            }


            const monthKey =

                date.getFullYear() +

                "-" +

                String(
                    date.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            monthlyTotals[monthKey] =
                (
                    monthlyTotals[
                        monthKey
                    ] || 0
                ) +
                transaction.amount;

        }
    );



    return monthKeys.map(
        function (monthKey) {

            return (
                monthlyTotals[
                    monthKey
                ] || 0
            );

        }
    );

}





// ==========================
// RENDER TABLE
// ==========================

function renderReportTransactions() {


    const tableBody =
        document.getElementById(
            "reportTransactionList"
        );


    const recordCount =
        document.getElementById(
            "reportRecordCount"
        );


    const totalRecords =
        filteredReportTransactions.length;



    recordCount.textContent =

        totalRecords +

        (
            totalRecords === 1

                ? " record found"

                : " records found"
        );



    if (totalRecords === 0) {


        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="report-empty-state"
                >

                    No transactions match the selected filters.

                </td>

            </tr>

        `;


        return;

    }



    tableBody.innerHTML =
        filteredReportTransactions

            .map(
                function (transaction) {


                    const typeText =

                        transaction.type ===
                        "income"

                            ? "Income"

                            : "Expense";


                    const amountClass =

                        transaction.type ===
                        "income"

                            ? "report-positive"

                            : "report-negative";


                    const amountSign =

                        transaction.type ===
                        "income"

                            ? "+"

                            : "-";


                    return `

                        <tr>


                            <td>

                                <span
                                    class="transaction-type ${transaction.type}"
                                >

                                    ${typeText}

                                </span>

                            </td>


                            <td>

                                ${escapeReportHTML(
                                    transaction.name
                                )}

                            </td>


                            <td>

                                ${escapeReportHTML(
                                    transaction.category
                                )}

                            </td>


                            <td class="${amountClass}">

                                ${amountSign}${formatReportCurrency(
                                    transaction.amount
                                )}

                            </td>


                            <td>

                                ${formatReportDate(
                                    transaction.date
                                )}

                            </td>


                        </tr>

                    `;

                }
            )

            .join("");

}





// ==========================
// ESCAPE HTML
// ==========================

function escapeReportHTML(value) {


    return String(
        value || ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}





// ==========================
// EXPORT CSV
// ==========================

function exportReportCSV() {


    if (
        filteredReportTransactions
            .length === 0
    ) {

        alert(
            "There are no report records to export."
        );


        return;

    }



    const csvRows = [

        [

            "Type",

            "Name or Source",

            "Category",

            "Amount",

            "Date"

        ]

    ];



    filteredReportTransactions.forEach(
        function (transaction) {


            csvRows.push([

                transaction.type ===
                    "income"

                    ? "Income"

                    : "Expense",


                transaction.name,


                transaction.category,


                transaction.amount
                    .toFixed(2),


                transaction.date

            ]);

        }
    );



    const csvContent =
        csvRows

            .map(
                function (row) {


                    return row

                        .map(
                            function (cell) {


                                const text =
                                    String(
                                        cell || ""
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
                        )

                        .join(",");

                }
            )

            .join("\n");



    const csvFile =
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



    const downloadUrl =
        URL.createObjectURL(
            csvFile
        );


    const downloadLink =
        document.createElement(
            "a"
        );


    downloadLink.href =
        downloadUrl;


    downloadLink.download =

        "expense-tracker-report-" +

        dateToInputValue(
            new Date()
        ) +

        ".csv";


    document.body.appendChild(
        downloadLink
    );


    downloadLink.click();


    downloadLink.remove();


    URL.revokeObjectURL(
        downloadUrl
    );

}





// ==========================
// DISPLAY USER
// ==========================

function displayReportUser() {


    const username =
        localStorage.getItem(
            "username"
        ) || "User";


    document.getElementById(
        "welcomeUser"
    ).textContent =

        "Welcome, " +

        username;


    document.getElementById(
        "sidebarUsername"
    ).textContent =
        username;

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
// ACTIVE SIDEBAR LINK
// ==========================

function highlightCurrentReportPage() {


    const currentPage =
        window.location.pathname

            .split("/")

            .pop() ||

        "reports.html";



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





// CLOSE SIDEBAR USING ESCAPE

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





// ==========================
// LOAD PAGE
// ==========================

document.addEventListener(
    "DOMContentLoaded",
    function () {


        displayReportUser();


        highlightCurrentReportPage();


        loadReportData();

    }
);