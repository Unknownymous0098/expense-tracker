const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();

const PORT = process.env.PORT || 3000;



// =======================
// DATABASE
// =======================

const db = new sqlite3.Database(
    "./database/expense.db",
    function (err) {

        if (err) {

            console.log(
                "Database Error:",
                err.message
            );

        } else {

            console.log(
                "SQLite Connected"
            );

        }

    }
);



// =======================
// CREATE TABLES
// =======================

function createTables() {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `);


    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id)
                REFERENCES users(id)
        )
    `);


    db.run(`
        CREATE TABLE IF NOT EXISTS incomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id)
                REFERENCES users(id)
        )
    `);


    console.log("Tables Ready");

}


createTables();



// =======================
// MIDDLEWARE
// =======================

app.use(express.json());

app.use(express.static("public"));



// =======================
// REGISTER
// =======================

app.post("/register", async function (req, res) {

    try {

        const {
            username,
            email,
            password
        } = req.body;


        if (
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Please complete all fields."
            });

        }


        const hashedPassword =
            await bcrypt.hash(password, 10);


        db.run(
            `
            INSERT INTO users
            (username, email, password)

            VALUES (?, ?, ?)
            `,

            [
                username.trim(),
                email.trim().toLowerCase(),
                hashedPassword
            ],

            function (err) {

                if (err) {

                    if (
                        err.message.includes(
                            "UNIQUE constraint failed"
                        )
                    ) {

                        return res.status(409).json({
                            success: false,
                            message: "Email already exists."
                        });

                    }


                    return res.status(500).json({
                        success: false,
                        message: "Unable to register user."
                    });

                }


                return res.status(201).json({
                    success: true,
                    message: "Registration successful."
                });

            }
        );

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Server error."
        });

    }

});



// =======================
// LOGIN
// =======================

app.post("/login", async function (req, res) {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please enter your email and password."
            });

        }


        db.get(
            `
            SELECT *
            FROM users
            WHERE email = ?
            `,

            [
                email.trim().toLowerCase()
            ],

            async function (err, user) {

                if (err) {

                    console.error(
                        "Login database error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to log in."
                    });

                }


                if (!user) {

                    return res.status(404).json({
                        success: false,
                        message: "User not found."
                    });

                }


                const match =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                if (!match) {

                    return res.status(401).json({
                        success: false,
                        message: "Incorrect password."
                    });

                }


                return res.json({
                    success: true,
                    userId: user.id,
                    username: user.username
                });

            }
        );

    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({
            success: false,
            message: "Server error."
        });

    }

});



// =======================
// GET EXPENSES
// =======================

app.get(
    "/expenses/:userId",
    function (req, res) {

        db.all(
            `
            SELECT *
            FROM expenses
            WHERE user_id = ?
            ORDER BY date DESC, id DESC
            `,

            [
                req.params.userId
            ],

            function (err, rows) {

                if (err) {

                    console.error(
                        "Get expenses error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to load expenses."
                    });

                }


                return res.json(rows);

            }
        );

    }
);



// =======================
// ADD EXPENSE
// =======================

app.post(
    "/expenses",
    function (req, res) {

        let {
            userId,
            name,
            category,
            amount,
            date
        } = req.body;


        amount = Number(amount);


        if (
            !userId ||
            !name ||
            !category ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Please enter valid expense details."
            });

        }


        if (!date) {

            date = new Date()
                .toISOString()
                .split("T")[0];

        }


        db.run(
            `
            INSERT INTO expenses
            (
                user_id,
                name,
                category,
                amount,
                date
            )

            VALUES (?, ?, ?, ?, ?)
            `,

            [
                userId,
                name.trim(),
                category,
                amount,
                date
            ],

            function (err) {

                if (err) {

                    console.error(
                        "Add expense error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to add expense."
                    });

                }


                db.get(
                    `
                    SELECT *
                    FROM expenses
                    WHERE id = ?
                    `,

                    [
                        this.lastID
                    ],

                    function (selectError, row) {

                        if (selectError) {

                            return res.status(500).json({
                                success: false,
                                message: "Expense was saved but could not be returned."
                            });

                        }


                        return res.status(201).json(row);

                    }
                );

            }
        );

    }
);



// =======================
// DELETE EXPENSE
// =======================

app.delete(
    "/expenses/:id/:userId",
    function (req, res) {

        db.run(
            `
            DELETE FROM expenses
            WHERE id = ?
            AND user_id = ?
            `,

            [
                req.params.id,
                req.params.userId
            ],

            function (err) {

                if (err) {

                    console.error(
                        "Delete expense error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to delete expense."
                    });

                }


                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Expense not found."
                    });

                }


                return res.json({
                    success: true
                });

            }
        );

    }
);



// =======================
// GET INCOMES
// =======================

app.get(
    "/incomes/:userId",
    function (req, res) {

        db.all(
            `
            SELECT *
            FROM incomes
            WHERE user_id = ?
            ORDER BY date DESC, id DESC
            `,

            [
                req.params.userId
            ],

            function (err, rows) {

                if (err) {

                    console.error(
                        "Get incomes error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to load income records."
                    });

                }


                return res.json(rows);

            }
        );

    }
);



// =======================
// ADD INCOME
// =======================

app.post(
    "/incomes",
    function (req, res) {

        let {
            userId,
            source,
            category,
            amount,
            date
        } = req.body;


        amount = Number(amount);


        if (
            !userId ||
            !source ||
            !category ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Please enter valid income details."
            });

        }


        if (!date) {

            date = new Date()
                .toISOString()
                .split("T")[0];

        }


        db.run(
            `
            INSERT INTO incomes
            (
                user_id,
                source,
                category,
                amount,
                date
            )

            VALUES (?, ?, ?, ?, ?)
            `,

            [
                userId,
                source.trim(),
                category,
                amount,
                date
            ],

            function (err) {

                if (err) {

                    console.error(
                        "Add income error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to add income."
                    });

                }


                db.get(
                    `
                    SELECT *
                    FROM incomes
                    WHERE id = ?
                    `,

                    [
                        this.lastID
                    ],

                    function (selectError, row) {

                        if (selectError) {

                            return res.status(500).json({
                                success: false,
                                message: "Income was saved but could not be returned."
                            });

                        }


                        return res.status(201).json(row);

                    }
                );

            }
        );

    }
);



// =======================
// DELETE INCOME
// =======================

app.delete(
    "/incomes/:id/:userId",
    function (req, res) {

        db.run(
            `
            DELETE FROM incomes
            WHERE id = ?
            AND user_id = ?
            `,

            [
                req.params.id,
                req.params.userId
            ],

            function (err) {

                if (err) {

                    console.error(
                        "Delete income error:",
                        err
                    );


                    return res.status(500).json({
                        success: false,
                        message: "Unable to delete income."
                    });

                }


                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Income record not found."
                    });

                }


                return res.json({
                    success: true
                });

            }
        );

    }
);



// =======================
// START SERVER
// =======================

app.listen(
    PORT,
    function () {

        console.log(
            "Server running on port " + PORT
        );

    }
);