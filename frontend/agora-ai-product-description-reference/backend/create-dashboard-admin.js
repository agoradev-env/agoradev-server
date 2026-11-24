const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");

const usersFile = path.join(
    __dirname,
    "data",
    "dashboard-users.json"
);

const rl = readline.createInterface({
    input: stdin,
    output: stdout
});

async function createAdmin() {
    try {
        const email = (
            await rl.question("Administrator email: ")
        ).trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Please enter a valid email address.");
        }

        const password = await rl.question(
            "Create administrator password: "
        );

        if (password.length < 12) {
            throw new Error(
                "Password must contain at least 12 characters."
            );
        }

        const confirmPassword = await rl.question(
            "Confirm administrator password: "
        );

        if (password !== confirmPassword) {
            throw new Error("The passwords do not match.");
        }

        let users = [];

        if (fs.existsSync(usersFile)) {
            users = JSON.parse(
                fs.readFileSync(usersFile, "utf8")
            );
        }

        if (!Array.isArray(users)) {
            throw new Error("Dashboard users file has an invalid format.");
        }

        const existingUser = users.find(
            user => user.email === email
        );

        if (existingUser) {
            throw new Error(
                "An account with this email already exists."
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        users.push({
            id: require("crypto").randomUUID(),
            email,
            passwordHash,
            role: "admin",
            enabled: true,
            createdAt: new Date().toISOString()
        });

        fs.writeFileSync(
            usersFile,
            JSON.stringify(users, null, 4),
            "utf8"
        );

        console.log("\nAdministrator account created successfully.");
        console.log(`Email: ${email}`);
        console.log("Role: admin");
        console.log("Status: enabled");

    } catch (error) {
        console.error("\nAccount creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        rl.close();
    }
}

createAdmin();
