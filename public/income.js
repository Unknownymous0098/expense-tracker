// ==========================
// GLOBAL VARIABLES
// ==========================

let incomes = [];

let totalIncomeAmount = 0;
let incomeRecordCount = 0;

const incomeUserId =
    localStorage.getItem("userId");


const incomePesoFormatter =
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

if (!incomeUserId) {

    window.location.href =
        "login.html";

}



// ==========================
// HELPERS
// ==========================

function getIncomeElement(id) {

    return document.getElementById(id);

}



function formatIncomeCurrency(amount) {

    return incomePesoFormatter.format(
        Number(amount) || 0
    );

}



function formatIncomeDate(dateString) {

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



function setDefaultIncomeDate() {

    const dateInput =
        getIncomeElement("incomeDate");


    if (!dateInput) {

        return;

    }


    dateInput.value =
        new Date()
            .toISOString()
            .split("T")[0];

}



function calculateIncomeTotals() {

    totalIncomeAmount =
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


    incomeRecordCount =
        incomes.length;

}



// ==========================
// ADD INCOME
// ==========================

async function addIncome() {

    const sourceInput =
        getIncomeElement(
            "incomeSource"
        );


    const categoryInput =
        getIncomeElement(
            "incomeCategory"
        );


    const amountInput =
        getIncomeElement(
            "incomeAmount"
        );


    const dateInput =
        getIncomeElement(
            "incomeDate"
        );


    const source =
        sourceInput.value.trim();


    const category =
        categoryInput.value;


    const amount =
        Number(
            amountInput.value
        );


    const date =
        dateInput.value;


    if (!source) {

        alert(
            "Please enter an income source."
        );

        sourceInput.focus();

        return;

    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        alert(
            "Please enter a valid amount greater than zero."
        );

        amountInput.focus();

        return;

    }


    if (!date) {

        alert(
            "Please select an income date."
        );

        dateInput.focus();

        return;

    }


    try {

        const response =
            await fetch(
                "/incomes",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        userId:
                            incomeUserId,

                        source:
                            source,

                        category:
                            category,

                        amount:
                            amount,

                        date:
                            date
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
                "Unable to add income."
            );

            return;

        }


        incomes.push(data);


        calculateIncomeTotals();

        renderIncomePage();


        sourceInput.value = "";

        amountInput.value = "";

        categoryInput.value =
            "Salary";


        setDefaultIncomeDate();


        alert(
            "Income added successfully."
        );

    } catch (error) {

        console.error(
            "Add income error:",
            error
        );


        alert(
            "Server connection error."
        );

    }

}



// ==========================
// CREATE INCOME ROW
// ==========================

function createIncomeRow(income) {

    const row =
        document.createElement("tr");


    const sourceCell =
        document.createElement("td");


    const categoryCell =
        document.createElement("td");


    const amountCell =
        document.createElement("td");


    const dateCell =
        document.createElement("td");


    const actionCell =
        document.createElement("td");


    sourceCell.textContent =
        income.source || "Unknown";


    categoryCell.textContent =
        income.category || "Others";


    amountCell.textContent =
        formatIncomeCurrency(
            income.amount
        );


    amountCell.className =
        "income-amount-cell";


    dateCell.textContent =
        formatIncomeDate(
            income.date
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

            deleteIncome(
                income.id
            );

        }
    );


    actionCell.appendChild(
        deleteButton
    );


    row.appendChild(
        sourceCell
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
// DISPLAY INCOME
// ==========================

function displayIncomes(
    list = incomes
) {

    const tableBody =
        getIncomeElement(
            "incomeList"
        );


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
            "No income records found.";


        row.appendChild(cell);

        tableBody.appendChild(row);

        return;

    }


    list.forEach(
        function (income) {

            tableBody.appendChild(
                createIncomeRow(
                    income
                )
            );

        }
    );

}



// ==========================
// UPDATE SUMMARY
// ==========================

function updateIncomeSummary() {

    const totalElement =
        getIncomeElement(
            "totalIncome"
        );


    const countElement =
        getIncomeElement(
            "incomeCount"
        );


    const averageElement =
        getIncomeElement(
            "averageIncome"
        );


    const average =
        incomeRecordCount > 0
            ? totalIncomeAmount /
                incomeRecordCount
            : 0;


    if (totalElement) {

        totalElement.textContent =
            formatIncomeCurrency(
                totalIncomeAmount
            );

    }


    if (countElement) {

        countElement.textContent =
            incomeRecordCount;

    }


    if (averageElement) {

        averageElement.textContent =
            formatIncomeCurrency(
                average
            );

    }

}



// ==========================
// LOAD INCOMES
// ==========================

async function loadIncomes() {

    try {

        const response =
            await fetch(
                `/incomes/${incomeUserId}`
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

        renderIncomePage();

    } catch (error) {

        console.error(
            "Load income error:",
            error
        );


        alert(
            "Unable to load income records."
        );

    }

}



// ==========================
// FILTER INCOME
// ==========================

function filterIncomes() {

    const searchInput =
        getIncomeElement(
            "searchIncome"
        );


    const categoryInput =
        getIncomeElement(
            "filterIncomeCategory"
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


    const category =
        categoryInput.value;


    const filtered =
        incomes.filter(
            function (income) {

                const source =
                    String(
                        income.source || ""
                    )
                    .toLowerCase();


                const sourceMatches =
                    source.includes(
                        search
                    );


                const categoryMatches =
                    category === "All" ||
                    income.category ===
                        category;


                return (
                    sourceMatches &&
                    categoryMatches
                );

            }
        );


    displayIncomes(filtered);

}



// ==========================
// DELETE INCOME
// ==========================

async function deleteIncome(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this income record?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/incomes/${id}/${incomeUserId}`,
                {
                    method: "DELETE"
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
                "Unable to delete income."
            );

            return;

        }


        incomes =
            incomes.filter(
                function (income) {

                    return (
                        Number(
                            income.id
                        ) !==
                        Number(id)
                    );

                }
            );


        calculateIncomeTotals();

        renderIncomePage();

    } catch (error) {

        console.error(
            "Delete income error:",
            error
        );


        alert(
            "Unable to delete income."
        );

    }

}



// ==========================
// RENDER PAGE
// ==========================

function renderIncomePage() {

    displayIncomes();

    updateIncomeSummary();

}



// ==========================
// START PAGE
// ==========================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setDefaultIncomeDate();

        loadIncomes();

    }
);