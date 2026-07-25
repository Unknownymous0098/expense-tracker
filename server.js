const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// DATABASE
// =======================

const db = new sqlite3.Database(
    "./database/expense.db",
    function (err) {
        if (err) {
            console.log("Database Error:", err.message);
        } else {
            console.log("SQLite Connected");
        }
    }
);

// =======================
// CREATE TABLES + MIGRATIONS
// =======================

function addColumnIfMissing(tableName, columnName, definition) {
    db.all(`PRAGMA table_info(${tableName})`, function (err, columns) {
        if (err) {
            console.error(`Unable to inspect ${tableName}:`, err);
            return;
        }

        const exists = columns.some(function (column) {
            return column.name === columnName;
        });

        if (!exists) {
            db.run(
                `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`,
                function (alterError) {
                    if (alterError) {
                        console.error(
                            `Unable to add ${columnName} to ${tableName}:`,
                            alterError
                        );
                    } else {
                        console.log(
                            `Added ${tableName}.${columnName}`
                        );
                    }
                }
            );
        }
    });
}

function createTables() {
    db.serialize(function () {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email_verified INTEGER NOT NULL DEFAULT 0,
                verification_code TEXT,
                verification_expires INTEGER
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

        // Adds the new fields to an existing users table.
        addColumnIfMissing(
            "users",
            "email_verified",
            "INTEGER NOT NULL DEFAULT 0"
        );
        addColumnIfMissing(
            "users",
            "verification_code",
            "TEXT"
        );
        addColumnIfMissing(
            "users",
            "verification_expires",
            "INTEGER"
        );

        console.log("Tables Ready");
    });
}

createTables();

// =======================
// MIDDLEWARE
// =======================

app.use(express.json());
app.use(express.static("public"));

// =======================
// EMAIL HELPERS
// =======================

function createMailTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
}

function generateVerificationCode() {
    return crypto.randomInt(100000, 1000000).toString();
}

async function sendVerificationEmail(email, username, code) {
    const transporter = createMailTransporter();

    if (!transporter) {
        throw new Error(
            "Email service is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM."
        );
    }

    const fromAddress =
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER;

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: "Verify your Expense Tracker email",
        text:
            `Hello ${username},\n\n` +
            `Your Expense Tracker verification code is: ${code}\n\n` +
            "This code expires in 10 minutes.\n\n" +
            "If you did not create this account, you can ignore this message.",
        html:
            `<p>Hello ${escapeHtml(username)},</p>` +
            "<p>Your Expense Tracker verification code is:</p>" +
            `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>` +
            "<p>This code expires in 10 minutes.</p>" +
            "<p>If you did not create this account, you can ignore this message.</p>"
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =======================
// REGISTER
// =======================

app.post("/register", async function (req, res) {
    try {
        let {
            username,
            email,
            password
        } = req.body;

        username = String(username || "").trim();
        email = String(email || "").trim().toLowerCase();
        password = String(password || "");

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please complete all fields."
            });
        }

        if (username.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Username must contain at least 2 characters."
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        db.get(
            `
            SELECT id, email_verified
            FROM users
            WHERE email = ?
            `,
            [email],
            async function (lookupError, existingUser) {
                if (lookupError) {
                    console.error("Registration lookup error:", lookupError);
                    return res.status(500).json({
                        success: false,
                        message: "Unable to check the email address."
                    });
                }

                if (existingUser && existingUser.email_verified === 1) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists."
                    });
                }

                const hashedPassword =
                    await bcrypt.hash(password, 10);

                const verificationCode =
                    generateVerificationCode();

                const verificationExpires =
                    Date.now() + 10 * 60 * 1000;

                const saveAndSend = async function (userId, isNewUser) {
                    try {
                        await sendVerificationEmail(
                            email,
                            username,
                            verificationCode
                        );

                        return res.status(isNewUser ? 201 : 200).json({
                            success: true,
                            requiresVerification: true,
                            email,
                            message:
                                "Account created. Enter the 6-digit code sent to your email."
                        });
                    } catch (mailError) {
                        console.error("Verification email error:", mailError);

                        if (isNewUser) {
                            db.run(
                                "DELETE FROM users WHERE id = ?",
                                [userId]
                            );
                        }

                        return res.status(500).json({
                            success: false,
                            message:
                                "The account could not be completed because the verification email was not sent. Check the server email settings."
                        });
                    }
                };

                if (existingUser) {
                    db.run(
                        `
                        UPDATE users
                        SET username = ?,
                            password = ?,
                            verification_code = ?,
                            verification_expires = ?,
                            email_verified = 0
                        WHERE id = ?
                        `,
                        [
                            username,
                            hashedPassword,
                            verificationCode,
                            verificationExpires,
                            existingUser.id
                        ],
                        function (updateError) {
                            if (updateError) {
                                console.error(
                                    "Registration update error:",
                                    updateError
                                );
                                return res.status(500).json({
                                    success: false,
                                    message: "Unable to update registration."
                                });
                            }

                            saveAndSend(existingUser.id, false);
                        }
                    );

                    return;
                }

                db.run(
                    `
                    INSERT INTO users
                    (
                        username,
                        email,
                        password,
                        email_verified,
                        verification_code,
                        verification_expires
                    )
                    VALUES (?, ?, ?, 0, ?, ?)
                    `,
                    [
                        username,
                        email,
                        hashedPassword,
                        verificationCode,
                        verificationExpires
                    ],
                    function (insertError) {
                        if (insertError) {
                            if (
                                insertError.message.includes(
                                    "UNIQUE constraint failed"
                                )
                            ) {
                                return res.status(409).json({
                                    success: false,
                                    message: "Email already exists."
                                });
                            }

                            console.error(
                                "Registration insert error:",
                                insertError
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Unable to register user."
                            });
                        }

                        saveAndSend(this.lastID, true);
                    }
                );
            }
        );
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// =======================
// VERIFY EMAIL
// =======================

app.post("/verify-email", function (req, res) {
    const email =
        String(req.body.email || "")
            .trim()
            .toLowerCase();

    const code =
        String(req.body.code || "")
            .trim();

    if (!email || !/^\d{6}$/.test(code)) {
        return res.status(400).json({
            success: false,
            message: "Enter your email and the 6-digit verification code."
        });
    }

    db.get(
        `
        SELECT id, email_verified, verification_code, verification_expires
        FROM users
        WHERE email = ?
        `,
        [email],
        function (err, user) {
            if (err) {
                console.error("Verify email error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to verify the email."
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Account not found."
                });
            }

            if (user.email_verified === 1) {
                return res.json({
                    success: true,
                    message: "Email is already verified. You can log in."
                });
            }

            if (
                !user.verification_expires ||
                Date.now() > Number(user.verification_expires)
            ) {
                return res.status(410).json({
                    success: false,
                    message:
                        "The verification code has expired. Request a new code."
                });
            }

            if (user.verification_code !== code) {
                return res.status(400).json({
                    success: false,
                    message: "Incorrect verification code."
                });
            }

            db.run(
                `
                UPDATE users
                SET email_verified = 1,
                    verification_code = NULL,
                    verification_expires = NULL
                WHERE id = ?
                `,
                [user.id],
                function (updateError) {
                    if (updateError) {
                        console.error(
                            "Verify email update error:",
                            updateError
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Unable to complete verification."
                        });
                    }

                    return res.json({
                        success: true,
                        message:
                            "Email verified successfully. You can now log in."
                    });
                }
            );
        }
    );
});

// =======================
// RESEND VERIFICATION CODE
// =======================

app.post("/resend-verification", function (req, res) {
    const email =
        String(req.body.email || "")
            .trim()
            .toLowerCase();

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email address."
        });
    }

    db.get(
        `
        SELECT id, username, email_verified
        FROM users
        WHERE email = ?
        `,
        [email],
        async function (err, user) {
            if (err) {
                console.error("Resend verification lookup error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to find the account."
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Account not found."
                });
            }

            if (user.email_verified === 1) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already verified."
                });
            }

            const code = generateVerificationCode();
            const expires = Date.now() + 10 * 60 * 1000;

            db.run(
                `
                UPDATE users
                SET verification_code = ?,
                    verification_expires = ?
                WHERE id = ?
                `,
                [code, expires, user.id],
                async function (updateError) {
                    if (updateError) {
                        console.error(
                            "Resend verification update error:",
                            updateError
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Unable to create a new code."
                        });
                    }

                    try {
                        await sendVerificationEmail(
                            email,
                            user.username,
                            code
                        );

                        return res.json({
                            success: true,
                            message:
                                "A new verification code was sent."
                        });
                    } catch (mailError) {
                        console.error(
                            "Resend verification email error:",
                            mailError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to send the verification email. Check the server email settings."
                        });
                    }
                }
            );
        }
    );
});

// =======================
// LOGIN
// =======================

app.post("/login", async function (req, res) {
    try {
        const email =
            String(req.body.email || "")
                .trim()
                .toLowerCase();

        const password =
            String(req.body.password || "");

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
            [email],
            async function (err, user) {
                if (err) {
                    console.error("Login database error:", err);

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

                if (user.email_verified !== 1) {
                    return res.status(403).json({
                        success: false,
                        requiresVerification: true,
                        email: user.email,
                        message:
                            "Please verify your email before logging in."
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
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
});

// =======================
// DELETE ACCOUNT
// =======================

app.post("/delete-account", function (req, res) {
    const userId = Number(req.body.userId);
    const password = String(req.body.password || "");

    if (!Number.isInteger(userId) || userId <= 0 || !password) {
        return res.status(400).json({
            success: false,
            message: "User ID and password are required."
        });
    }

    db.get(
        `
        SELECT id, password
        FROM users
        WHERE id = ?
        `,
        [userId],
        async function (lookupError, user) {
            if (lookupError) {
                console.error("Delete account lookup error:", lookupError);
                return res.status(500).json({
                    success: false,
                    message: "Unable to verify the account."
                });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Account not found."
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatches) {
                return res.status(401).json({
                    success: false,
                    message: "Incorrect password."
                });
            }

            db.serialize(function () {
                db.run("BEGIN TRANSACTION");

                db.run(
                    "DELETE FROM expenses WHERE user_id = ?",
                    [userId],
                    function (expenseError) {
                        if (expenseError) {
                            return rollbackAccountDeletion(
                                res,
                                expenseError
                            );
                        }

                        db.run(
                            "DELETE FROM incomes WHERE user_id = ?",
                            [userId],
                            function (incomeError) {
                                if (incomeError) {
                                    return rollbackAccountDeletion(
                                        res,
                                        incomeError
                                    );
                                }

                                db.run(
                                    "DELETE FROM users WHERE id = ?",
                                    [userId],
                                    function (userError) {
                                        if (userError) {
                                            return rollbackAccountDeletion(
                                                res,
                                                userError
                                            );
                                        }

                                        if (this.changes === 0) {
                                            return rollbackAccountDeletion(
                                                res,
                                                new Error(
                                                    "Account was not deleted."
                                                )
                                            );
                                        }

                                        db.run(
                                            "COMMIT",
                                            function (commitError) {
                                                if (commitError) {
                                                    return rollbackAccountDeletion(
                                                        res,
                                                        commitError
                                                    );
                                                }

                                                return res.json({
                                                    success: true,
                                                    message:
                                                        "Your account and all associated data were deleted."
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            });
        }
    );
});

function rollbackAccountDeletion(res, error) {
    console.error("Delete account error:", error);

    db.run("ROLLBACK", function () {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message:
                    "Unable to delete the account. No changes were saved."
            });
        }
    });
}

// =======================
// GET EXPENSES
// =======================

app.get("/expenses/:userId", function (req, res) {
    db.all(
        `
        SELECT *
        FROM expenses
        WHERE user_id = ?
        ORDER BY date DESC, id DESC
        `,
        [req.params.userId],
        function (err, rows) {
            if (err) {
                console.error("Get expenses error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to load expenses."
                });
            }

            return res.json(rows);
        }
    );
});

// =======================
// ADD EXPENSE
// =======================

app.post("/expenses", function (req, res) {
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
                console.error("Add expense error:", err);
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
                [this.lastID],
                function (selectError, row) {
                    if (selectError) {
                        return res.status(500).json({
                            success: false,
                            message:
                                "Expense was saved but could not be returned."
                        });
                    }

                    return res.status(201).json(row);
                }
            );
        }
    );
});

// =======================
// DELETE EXPENSE
// =======================

app.delete("/expenses/:id/:userId", function (req, res) {
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
                console.error("Delete expense error:", err);
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
});

// =======================
// GET INCOMES
// =======================

app.get("/incomes/:userId", function (req, res) {
    db.all(
        `
        SELECT *
        FROM incomes
        WHERE user_id = ?
        ORDER BY date DESC, id DESC
        `,
        [req.params.userId],
        function (err, rows) {
            if (err) {
                console.error("Get incomes error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Unable to load income records."
                });
            }

            return res.json(rows);
        }
    );
});

// =======================
// ADD INCOME
// =======================

app.post("/incomes", function (req, res) {
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
                console.error("Add income error:", err);
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
                [this.lastID],
                function (selectError, row) {
                    if (selectError) {
                        return res.status(500).json({
                            success: false,
                            message:
                                "Income was saved but could not be returned."
                        });
                    }

                    return res.status(201).json(row);
                }
            );
        }
    );
});

// =======================
// DELETE INCOME
// =======================

app.delete("/incomes/:id/:userId", function (req, res) {
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
                console.error("Delete income error:", err);
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
});

// =======================
// START SERVER
// =======================

app.listen(PORT, function () {
    console.log("Server running on port " + PORT);
});
