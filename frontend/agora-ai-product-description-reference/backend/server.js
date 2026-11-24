require("dotenv").config();

const express = require("express");
const { rateLimit } = require("express-rate-limit");
const OpenAI = require("openai");
const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const session = require("express-session");

const app = express();

// Dashboard authentication sessions

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000
    }
}));

const PORT = process.env.PORT || 3000;

// Gmail SMTP configuration for automated reports

const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// AI generation rate limit

const aiGenerationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 5, // Maximum 5 requests per minute
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many AI generation requests. Please wait a minute before trying again."
    }
});

// Apply rate limit to AI description generation

app.use("/generate-description", aiGenerationLimiter);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// AI Usage Monitoring: local record storage

const usageFile = path.join(__dirname, "data", "usage.json");
const alertStateFile = path.join(__dirname, "data", "alert-state.json");

// Mark known historical practice failures as acknowledged

function acknowledgeHistoricalPracticeFailures() {
    const state = readAlertState();

    const practiceFailureIds = [
        "72bb349b-8505-4e13-826e-ea38ee32339e",
        "9c6d3818-78cd-46fc-860c-3bcc03a473c6"
    ];

    const acknowledgedIds = new Set(
        state.acknowledgedRequestIds || []
    );

    practiceFailureIds.forEach(requestId => {
        acknowledgedIds.add(requestId);
    });

    saveAlertState({
        ...state,
        acknowledgedRequestIds: [...acknowledgedIds]
    });
}

// Acknowledge known historical practice failures at server startup
acknowledgeHistoricalPracticeFailures();

// Read acknowledged monitoring alert request IDs

function readAlertState() {
    try {
        if (!fs.existsSync(alertStateFile)) {
            return {
                acknowledgedRequestIds: []
            };
        }

        return JSON.parse(
            fs.readFileSync(alertStateFile, "utf8")
        );

    } catch (error) {
        console.error("Could not read alert state:", error);
        throw error;
    }
}

// Save acknowledged monitoring alert request IDs

function saveAlertState(state) {
    try {
        fs.writeFileSync(
            alertStateFile,
            JSON.stringify(state, null, 2),
            "utf8"
        );

    } catch (error) {
        console.error("Could not save alert state:", error);
        throw error;
    }
}

// Product Description Generation Attempt Tracking

const productAttemptsFile = path.join(
    __dirname,
    "data",
    "product-attempts.json"
);

const MAX_ATTEMPTS_PER_PRODUCT = 3;

// Read product generation attempt records

function readProductAttempts() {
    try {
        if (!fs.existsSync(productAttemptsFile)) {
            return {};
        }

        return JSON.parse(
            fs.readFileSync(productAttemptsFile, "utf8")
        );

    } catch (error) {
        console.error("Could not read product attempts:", error);
        throw error;
    }
}

// Get the number of attempts used by a product

function getProductAttemptCount(productId) {
    const attempts = readProductAttempts();

    return attempts[productId] || 0;
}

// Record a new generation attempt

function recordProductAttempt(productId) {
    const attempts = readProductAttempts();

    attempts[productId] = (attempts[productId] || 0) + 1;

    fs.writeFileSync(
        productAttemptsFile,
        JSON.stringify(attempts, null, 2),
        "utf8"
    );

    return attempts[productId];
}

function readUsageRecords() {
    try {
        return JSON.parse(fs.readFileSync(usageFile, "utf8"));
    } catch (error) {
        console.error("Could not read usage records:", error);
        return [];
    }
}

function saveUsageRecord(record) {
    const records = readUsageRecords();

    records.push(record);

    fs.writeFileSync(
        usageFile,
        JSON.stringify(records, null, 2),
        "utf8"
    );
}


// Generate AI usage summary for email reports

function generateReportSummary(startDate, endDate) {
    const records = readUsageRecords();

    const filteredRecords = records.filter(record => {
        const recordDate = new Date(record.date);

        return recordDate >= startDate && recordDate < endDate;
    });

    const successful = filteredRecords.filter(
        record => record.status === "success"
    );

    const failed = filteredRecords.filter(
        record => record.status === "failed"
    );

    const totalTokens = filteredRecords.reduce(
        (sum, record) => sum + (Number(record.totalTokens) || 0),
        0
    );

    const totalSpending = filteredRecords.reduce(
        (sum, record) => sum + (Number(record.cost) || 0),
        0
    );

    const averageResponseTime = successful.length > 0
        ? successful.reduce(
            (sum, record) => sum + (Number(record.responseTimeMs) || 0),
            0
        ) / successful.length
        : 0;

    return {
        totalRequests: filteredRecords.length,
        successfulRequests: successful.length,
        failedRequests: failed.length,
        totalTokens,
        totalSpending,
        averageResponseTimeMs: averageResponseTime
    };
}

// Get reporting period boundaries using Nigeria time

function getLagosDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const values = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            values[part.type] = Number(part.value);
        }
    }

    return values;
}

function getLagosMidnight(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day) - 60 * 60 * 1000);
}

// Calculate the previous completed reporting period

function getPreviousReportingPeriod(reportType, referenceDate = new Date()) {
    const { year, month, day } = getLagosDateParts(referenceDate);

    const today = new Date(Date.UTC(year, month - 1, day));
    const currentMidnight = getLagosMidnight(year, month, day);

    let startDate;
    let endDate = currentMidnight;

    if (reportType === "daily") {
        const previousDay = new Date(today);
        previousDay.setUTCDate(previousDay.getUTCDate() - 1);

        startDate = getLagosMidnight(
            previousDay.getUTCFullYear(),
            previousDay.getUTCMonth() + 1,
            previousDay.getUTCDate()
        );

    } else if (reportType === "weekly") {
        const daysSinceMonday = (today.getUTCDay() + 6) % 7;

        const currentMonday = new Date(today);
        currentMonday.setUTCDate(currentMonday.getUTCDate() - daysSinceMonday);

        const previousMonday = new Date(currentMonday);
        previousMonday.setUTCDate(previousMonday.getUTCDate() - 7);

        startDate = getLagosMidnight(
            previousMonday.getUTCFullYear(),
            previousMonday.getUTCMonth() + 1,
            previousMonday.getUTCDate()
        );

        endDate = getLagosMidnight(
            currentMonday.getUTCFullYear(),
            currentMonday.getUTCMonth() + 1,
            currentMonday.getUTCDate()
        );

    } else if (reportType === "monthly") {
        const currentMonthStart = new Date(Date.UTC(year, month - 1, 1));
        const previousMonthStart = new Date(Date.UTC(year, month - 2, 1));

        startDate = getLagosMidnight(
            previousMonthStart.getUTCFullYear(),
            previousMonthStart.getUTCMonth() + 1,
            1
        );

        endDate = getLagosMidnight(
            currentMonthStart.getUTCFullYear(),
            currentMonthStart.getUTCMonth() + 1,
            1
        );

    } else {
        throw new Error("Invalid report type.");
    }

    return { startDate, endDate };
}

// Format AI usage report for email delivery

function formatUsageReport(reportType, summary, startDate, endDate) {
    const reportNames = {
        daily: "Daily AI Usage Report",
        weekly: "Weekly AI Usage Report",
        monthly: "Monthly AI Usage Report"
    };

    const period = `${startDate.toLocaleDateString("en-GB", {
        timeZone: "Africa/Lagos"
    })} – ${new Date(endDate.getTime() - 1).toLocaleDateString("en-GB", {
        timeZone: "Africa/Lagos"
    })}`;

    const spending = Number(summary.totalSpending || 0).toFixed(6);

    const text = `
${reportNames[reportType]}

Reporting period: ${period}

USAGE SUMMARY
Total requests: ${summary.totalRequests}
Successful requests: ${summary.successfulRequests}
Failed requests: ${summary.failedRequests}

TOKEN USAGE
Total tokens: ${summary.totalTokens.toLocaleString()}

COST SUMMARY
Total estimated expenditure: $${spending}

PERFORMANCE
Average successful response time: ${Math.round(summary.averageResponseTimeMs)} ms

This report was automatically generated by Agora AI Monitoring.
    `.trim();

    const html = `
        <h2>${reportNames[reportType]}</h2>
        <p><strong>Reporting period:</strong> ${period}</p>

        <h3>Usage Summary</h3>
        <ul>
            <li>Total requests: ${summary.totalRequests}</li>
            <li>Successful requests: ${summary.successfulRequests}</li>
            <li>Failed requests: ${summary.failedRequests}</li>
        </ul>

        <h3>Token Usage</h3>
        <p>Total tokens: ${summary.totalTokens.toLocaleString()}</p>

        <h3>Cost Summary</h3>
        <p>Total estimated expenditure: $${spending}</p>

        <h3>Performance</h3>
        <p>Average successful response time: ${Math.round(summary.averageResponseTimeMs)} ms</p>

        <hr>
        <p>This report was automatically generated by Agora AI Monitoring.</p>
    `;

    return { text, html };
}

// Generate and send an AI usage report by email

async function sendUsageReport(reportType) {
    const recipients = process.env.AI_REPORT_RECIPIENTS;

    if (!recipients) {
        console.error("AI report recipients are not configured.");
        return;
    }

    const { startDate, endDate } =
        getPreviousReportingPeriod(reportType);

    const summary = generateReportSummary(startDate, endDate);

    const report = formatUsageReport(
        reportType,
        summary,
        startDate,
        endDate
    );

    const reportNames = {
        daily: "Daily AI Usage Report",
        weekly: "Weekly AI Usage Report",
        monthly: "Monthly AI Usage Report"
    };

    try {
        await emailTransporter.sendMail({
            from: `"Agora AI Monitoring" <${process.env.EMAIL_USER}>`,
            to: recipients,
            subject: `Agora AI Monitoring - ${reportNames[reportType]}`,
            text: report.text,
            html: report.html
        });

        console.log(`${reportNames[reportType]} sent successfully.`);

    } catch (error) {
        console.error(
            `Could not send ${reportType} report:`,
            error.message
        );
    }
}

// Track recently emailed monitoring alerts

const recentlySentAlerts = new Map();

// Send important monitoring alerts by email

async function sendMonitoringAlertEmails(alerts) {
    const recipients = process.env.AI_REPORT_RECIPIENTS;

    if (!recipients || !alerts || alerts.length === 0) {
        return;
    }

    const cooldown = 30 * 60 * 1000;
    const now = Date.now();

    for (const alert of alerts) {
        const alertKey = `${alert.type}:${alert.message}`;

        const lastSent = recentlySentAlerts.get(alertKey);

        if (lastSent && now - lastSent < cooldown) {
            continue;
        }

        try {
            await emailTransporter.sendMail({
                from: `"Agora AI Monitoring" <${process.env.EMAIL_USER}>`,
                to: recipients,
                subject: `Agora AI Monitoring - ${alert.type.toUpperCase()} ALERT`,
                text: `
AGORA AI MONITORING ALERT

Alert type: ${alert.type.toUpperCase()}

${alert.message}

Please review the AI monitoring dashboard.

This is an automated notification.
                `.trim()
            });

            recentlySentAlerts.set(alertKey, now);

            console.log(`Monitoring alert email sent: ${alert.message}`);

        } catch (error) {
            console.error(
                "Monitoring alert email failed:",
                error.message
            );
        }
    }
}

// AI model pricing (USD per 1 million tokens)

const MODEL_PRICING = {
    "gpt-6-luna": {
        input: 0.10,
        cachedInput: 0.01,
        output: 0.50
    }
};

// Calculate the cost of an AI request

function calculateRequestCost(model, usage) {
    if (
        !usage ||
        usage.inputTokens == null ||
        usage.outputTokens == null
    ) {
        return null;
    }

    const pricing = MODEL_PRICING[model];

    if (!pricing) {
        return null;
    }

    const cachedInputTokens = usage.cachedInputTokens ?? 0;

    const uncachedInputTokens =
        usage.inputTokens - cachedInputTokens;

    const inputCost =
        (uncachedInputTokens / 1000000) * pricing.input;

    const cachedInputCost =
        (cachedInputTokens / 1000000) * pricing.cachedInput;

    const outputCost =
        (usage.outputTokens / 1000000) * pricing.output;

    return Number(
        (inputCost + cachedInputCost + outputCost).toFixed(10)
    );
}

// Check whether the monthly AI budget has been reached

function isMonthlyBudgetReached() {
    const monthlyBudget = Number(
        process.env.AI_MONTHLY_BUDGET_USD || 0
    );

    if (monthlyBudget <= 0) {
        return false;
    }

    const records = readUsageRecords();

    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlySpending = records
        .filter(record =>
            record.date &&
            record.date.startsWith(currentMonth)
        )
        .reduce((total, record) => {
            return total + (Number(record.cost) || 0);
        }, 0);

    return monthlySpending >= monthlyBudget;
}

// Check whether the daily AI spending limit has been reached

function isDailyBudgetReached() {
    const dailyBudget = Number(
        process.env.AI_DAILY_BUDGET_USD || 0
    );

    if (dailyBudget <= 0) {
        return false;
    }

    const records = readUsageRecords();

    const today = new Date().toISOString().slice(0, 10);

    const dailySpending = records
        .filter(record =>
            record.date &&
            record.date.startsWith(today)
        )
        .reduce((total, record) => {
            return total + (Number(record.cost) || 0);
        }, 0);

    return dailySpending >= dailyBudget;
}


// Check whether the daily AI token limit has been reached

function isDailyTokenLimitReached() {
    const dailyTokenLimit = Number(
        process.env.AI_DAILY_TOKEN_LIMIT || 0
    );

    if (dailyTokenLimit <= 0) {
        return false;
    }

    const records = readUsageRecords();

    const today = new Date().toISOString().slice(0, 10);

    const dailyTokens = records
        .filter(record =>
            record.date &&
            record.date.startsWith(today)
        )
        .reduce((total, record) => {
            return total + (Number(record.totalTokens) || 0);
        }, 0);

    return dailyTokens >= dailyTokenLimit;
}


function isTokensPerMinuteLimitReached() {
    const tokensPerMinuteLimit = Number(
        process.env.AI_TOKENS_PER_MINUTE_LIMIT || 0
    );

    if (tokensPerMinuteLimit <= 0) {
        return false;
    }

    const records = readUsageRecords();

    const oneMinuteAgo = Date.now() - 60 * 1000;

    const tokensUsedInLastMinute = records
        .filter(record =>
            record.date &&
            new Date(record.date).getTime() >= oneMinuteAgo &&
            record.status === "success"
        )
        .reduce((total, record) => {
            return total + (Number(record.totalTokens) || 0);
        }, 0);

    return tokensUsedInLastMinute >= tokensPerMinuteLimit;
}

app.use(express.json());


const bcrypt = require("bcryptjs");

// Dashboard user storage

const dashboardUsersFile = path.join(
    __dirname,
    "data",
    "dashboard-users.json"
);

function readDashboardUsers() {
    return JSON.parse(
        fs.readFileSync(dashboardUsersFile, "utf8")
    );
}

// Dashboard login

app.post("/api/dashboard/login", async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const password = String(req.body.password || "");

        const users = readDashboardUsers();

        const user = users.find(
            account => account.email === email
        );

        if (!user || !user.enabled) {
            return res.status(403).json({
                success: false,
                code: "ACCESS_DENIED",
                message: "Access denied. This email is not authorised to access the Agora AI Monitoring Dashboard."
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                code: "INVALID_CREDENTIALS",
                message: "Incorrect email or password."
            });
        }

        req.session.regenerate(error => {
            if (error) {
                console.error("Session creation error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to create login session."
                });
            }

            req.session.dashboardUser = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            req.session.save(saveError => {
                if (saveError) {
                    console.error("Session save error:", saveError);

                    return res.status(500).json({
                        success: false,
                        message: "Unable to save login session."
                    });
                }

                return res.json({
                    success: true,
                    message: "Login successful.",
                    user: {
                        email: user.email,
                        role: user.role
                    }
                });
            });
        });

    } catch (error) {
        console.error("Dashboard login error:", error);

        res.status(500).json({
            success: false,
            message: "An error occurred during login."
        });
    }
});

// Check current dashboard session

app.get("/api/dashboard/session", (req, res) => {
    if (!req.session.dashboardUser) {
        return res.status(401).json({
            authenticated: false
        });
    }

    res.json({
        authenticated: true,
        user: req.session.dashboardUser
    });
});

// Dashboard logout

app.post("/api/dashboard/logout", (req, res) => {
    req.session.destroy(error => {
        if (error) {
            console.error("Dashboard logout error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to log out."
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logged out successfully."
        });
    });
});

// Public dashboard login page

app.get("/monitoring/login", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../monitoring/login.html")
    );
});

// Public Access Denied page

app.get("/monitoring/access-denied", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../monitoring/access-denied.html")
    );
});

// Protect all other monitoring dashboard files

app.use(
    "/monitoring",
    requireDashboardPageAuth,
    express.static(path.join(__dirname, "../monitoring"))
);

app.use(express.static(path.join(__dirname, "../frontend")));

// AI Product Description Generation

app.post("/generate-description", async (req, res) => {
    const requestId = randomUUID();
    const startedAt = Date.now();
    const model = "gpt-6-luna";
    let tokenUsage = null;

    let attemptsUsed = null;
    let attemptsRemaining = null;

    try {
        const {
            productId,
            productName,
            productCategory,
            productDetails
        } = req.body;

        if (!productName || !productCategory) {
            return res.status(400).json({
                success: false,
                message: "Product name and category are required."
            });
        }

        // Validate maximum seller input length

        const MAX_INPUT_CHARACTERS = 2000;

        const productDetailsText = Array.isArray(productDetails)
            ? productDetails.map(detail =>
                `${detail.name ?? ""}: ${detail.value ?? ""}`
            ).join("\n")
            : "";

        const totalInputLength =
            productName.length +
            productCategory.length +
            productDetailsText.length;

        if (totalInputLength > MAX_INPUT_CHARACTERS) {
            return res.status(400).json({
                success: false,
                message: `Your product information is too long. Please keep the combined input within ${MAX_INPUT_CHARACTERS} characters.`
            });
        }

        // Check tokens-per-minute limit before generation

        if (isTokensPerMinuteLimitReached()) {
            return res.status(429).json({
                success: false,
                message: "The AI token usage limit per minute has been reached. Please wait before trying again."
            });
        }

        // Validate product listing ID

        if (
            !productId ||
            typeof productId !== "string" ||
            !productId.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid product listing ID is required."
            });
        }

        // Check product generation attempt limit

        attemptsUsed = getProductAttemptCount(productId);

        if (attemptsUsed >= MAX_ATTEMPTS_PER_PRODUCT) {
            attemptsRemaining = 0;

            return res.status(429).json({
                success: false,
                message: "You have used all 3 AI generation attempts for this product. You can still edit the description manually.",
                attemptsUsed,
                attemptsRemaining
            });
        }

        // Record this attempt before calling the AI provider

        attemptsUsed = recordProductAttempt(productId);

        attemptsRemaining = MAX_ATTEMPTS_PER_PRODUCT - attemptsUsed;

        const response = await openai.responses.create({
            model: model,

            instructions: `
IDENTITY AND ROLE:

You are Agora's AI Product Description Specialist,
an experienced e-commerce copywriter responsible for
creating high-quality product descriptions for an online marketplace.

YOUR OBJECTIVE:

Transform seller-provided product information into clear,
compelling, natural and informative product descriptions
that help buyers understand what they are purchasing.

WRITING STANDARDS:

1. Write in natural, human-sounding language.
2. Make descriptions engaging, clear and easy to understand.
3. Adapt your wording to the product category.
4. Highlight relevant product features and specifications.
5. Use a professional but approachable tone.
6. Avoid unnecessary repetition, generic openings
   and exaggerated marketing language.
7. Keep descriptions concise while providing useful information.

ACCURACY RULES:

1. Use only information supplied by the seller.
2. Never invent product features, materials, benefits,
   specifications, certifications or guarantees.
3. Never make unsupported quality or performance claims.
4. Do not assume missing product information.
5. When information is limited, write a shorter
   description rather than filling gaps with assumptions.

STRICT FACTUAL ACCURACY:

Every factual statement in the description must be directly
supported by the product information supplied by the seller.

Do not infer or assume product benefits from product features.

For example:
- A screw-on lid does not automatically mean leak-proof.
- Stainless steel does not automatically mean durable.
- A product's size does not establish its suitability
  for a particular use.
- A material does not establish product quality.

Do not introduce claims about durability, comfort, safety,
performance, quality, suitability or functionality unless
the seller explicitly provides that information.

Do not describe a product as premium, high-quality,
long-lasting, comfortable, reliable or effective unless
the seller has supplied information supporting that claim.

Do not turn product specifications into unverified benefits.

ADDITIONAL FACTUAL RESTRICTIONS:

1. Do not turn a product specification into a performance
   claim or benefit.

2. Do not describe a product as suitable for a particular
   activity, setting, audience or purpose unless the seller
   explicitly provides that information.

3. Avoid words such as convenient, secure, reliable,
   comfortable, durable, versatile and premium unless
   supported by seller-provided information.

4. Do not add assumptions simply to make the description
   sound more persuasive.

5. Prefer straightforward descriptions of verified product
   characteristics over unsupported marketing language.

6. Every sentence must remain factually grounded in the
   seller's submitted information.

When in doubt, leave the claim out.

OUTPUT REQUIREMENTS:

Return only the finished product description.

Do not include headings such as "Product Description",
explanations, notes or commentary.
`,

            input: `
Product name: ${productName}

Product category: ${productCategory}

Product details:
${JSON.stringify(productDetails, null, 2)}

Write a suitable product description for this listing.
`,

            max_output_tokens: 250
        });

        // Capture actual token usage

        tokenUsage = response.usage
            ? {
                inputTokens: response.usage.input_tokens ?? null,
                outputTokens: response.usage.output_tokens ?? null,
                totalTokens: response.usage.total_tokens ?? null,
                cachedInputTokens:
                    response.usage.input_tokens_details?.cached_tokens ?? 0
            }
            : null;

        const description = response.output_text;

        if (!description) {
            throw new Error("The AI returned an empty description.");
        }

        const responseTimeMs = Date.now() - startedAt;

        // Save successful request

        saveUsageRecord({
            requestId,
            sellerId: req.user?.id ?? null,
            provider: "openai",
            date: new Date().toISOString(),
            model,
            inputTokens: tokenUsage?.inputTokens ?? null,
            outputTokens: tokenUsage?.outputTokens ?? null,
            totalTokens: tokenUsage?.totalTokens ?? null,
            cost: calculateRequestCost(model, tokenUsage),
            status: "success",
            responseTimeMs,
            error: null
        });

        res.json({
            success: true,
            description: description,
            attemptsUsed,
            attemptsRemaining
        });

    } catch (error) {
        console.error("AI description generation failed:", error);

        const responseTimeMs = Date.now() - startedAt;

        // Save failed request

        saveUsageRecord({
            requestId,
            sellerId: req.user?.id ?? null,
            provider: "openai",
            date: new Date().toISOString(),
            model,
            inputTokens: tokenUsage?.inputTokens ?? null,
            outputTokens: tokenUsage?.outputTokens ?? null,
            totalTokens: tokenUsage?.totalTokens ?? null,
            cost: calculateRequestCost(model, tokenUsage),
            status: "failed",
            responseTimeMs,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: "Unable to generate a product description. Please try again.",
            attemptsUsed,
            attemptsRemaining
        });
    }
});

// AI Usage Monitoring Endpoint

function requireDashboardAuth(req, res, next) {
    if (!req.session.dashboardUser) {
        return res.status(401).json({
            success: false,
            code: "AUTHENTICATION_REQUIRED",
            message: "Please sign in to access the Agora AI Monitoring Dashboard."
        });
    }

    next();
}

function requireDashboardPageAuth(req, res, next) {
    try {
        const sessionUser = req.session.dashboardUser;

        // Visitors who have not signed in go to the login page.
        if (!sessionUser) {
            return res.redirect("/monitoring/login");
        }

        // Confirm that the account still exists and is enabled.
        const users = readDashboardUsers();

        const activeUser = users.find(user =>
            user.id === sessionUser.id &&
            user.enabled === true
        );

        // Revoke access if the account has been disabled or removed.
        if (!activeUser) {
            return req.session.destroy(() => {
                res.redirect("/monitoring/access-denied");
            });
        }

        next();

    } catch (error) {
        console.error("Dashboard page access error:", error);

        res.status(500).send("Unable to verify dashboard access.");
    }
}

app.get("/api/monitoring", requireDashboardAuth, async (req, res) => {
    try {
        const records = readUsageRecords();

        const currentMonth = new Date().toISOString().slice(0, 7);

        const monthlyRecords = records.filter(record =>
            record.date && record.date.startsWith(currentMonth)
        );

        const totalRequests = monthlyRecords.length;

        const successfulRequests = monthlyRecords.filter(
            record => record.status === "success"
        ).length;

        const failedRequests = monthlyRecords.filter(
            record => record.status === "failed"
        ).length;

        const totalTokens = monthlyRecords.reduce(
            (sum, record) => sum + (record.totalTokens ?? 0), 0
        );

        const totalSpending = monthlyRecords.reduce(
            (sum, record) => sum + (record.cost ?? 0), 0
        );

        const monthlyBudget = Number(
            process.env.AI_MONTHLY_BUDGET_USD || 0
        );

        const spendingPercentage = monthlyBudget > 0
            ? (totalSpending / monthlyBudget) * 100
            : 0;


        const alerts = [];

        // Calculate daily usage

        const today = new Date().toISOString().slice(0, 10);

        const dailyRecords = records.filter(record =>
            record.date && record.date.startsWith(today)
        );

        const dailySpending = dailyRecords.reduce(
            (sum, record) => sum + (Number(record.cost) || 0), 0
        );

        const dailyTokens = dailyRecords.reduce(
            (sum, record) => sum + (Number(record.totalTokens) || 0), 0
        );

        // Existing failed request alert

        // Exclude previously acknowledged practice failures from active alerts

        const alertState = readAlertState();

        const acknowledgedRequestIds = new Set(
            alertState.acknowledgedRequestIds || []
        );

        const unacknowledgedFailedRecords = monthlyRecords.filter(
            record =>
                record.status === "failed" &&
                !acknowledgedRequestIds.has(record.requestId)
        );

        if (unacknowledgedFailedRecords.length > 0) {
            alerts.push({
                type: "error",
             message: `${unacknowledgedFailedRecords.length} unacknowledged AI request(s) failed this month.`
            });
        }

        // Existing monthly spending alerts

        if (monthlyBudget > 0) {
            if (spendingPercentage >= 100) {
                alerts.push({
                    type: "critical",
                    message: "Monthly AI monitoring budget reached. Arrange additional funding."
                });
            } else if (spendingPercentage >= 90) {
                alerts.push({
                    type: "critical",
                    message: `Critical: ${spendingPercentage.toFixed(1)}% of the monthly AI budget has been used.`
                });
            } else if (spendingPercentage >= 70) {
                alerts.push({
                    type: "warning",
                    message: `Warning: ${spendingPercentage.toFixed(1)}% of the monthly AI budget has been used.`
                });
            }
        }

        // Daily spending alerts

        const dailyBudget = Number(
            process.env.AI_DAILY_BUDGET_USD || 0
        );

        if (dailyBudget > 0) {
            const dailySpendingPercentage =
                (dailySpending / dailyBudget) * 100;

            if (dailySpendingPercentage >= 100) {
                alerts.push({
                    type: "critical",
                    message: "Daily AI spending limit reached."
                });
            } else if (dailySpendingPercentage >= 80) {
                alerts.push({
                    type: "warning",
                    message: `Daily AI spending is at ${dailySpendingPercentage.toFixed(1)}% of its limit.`
                });
            }
        }

        // Daily token usage alerts

        const dailyTokenLimit = Number(
            process.env.AI_DAILY_TOKEN_LIMIT || 0
        );

        if (dailyTokenLimit > 0) {
            const dailyTokenPercentage =
                (dailyTokens / dailyTokenLimit) * 100;

            if (dailyTokenPercentage >= 100) {
                alerts.push({
                    type: "critical",
                    message: "Daily AI token usage limit reached."
                });
            } else if (dailyTokenPercentage >= 80) {
                alerts.push({
                    type: "warning",
                    message: `Daily AI token usage is at ${dailyTokenPercentage.toFixed(1)}% of its limit.`
                });
            }
        }

        // AI provider unavailability alerts

        const providerUnavailable = monthlyRecords.filter(record =>
            record.status === "failed" &&
            !acknowledgedRequestIds.has(record.requestId) &&
            /unavailable|ECONNRESET|ECONNREFUSED|ETIMEDOUT|503/i.test(
                String(record.error || "")
            )
        );

        if (providerUnavailable.length > 0) {
            alerts.push({
                type: "critical",
                message: "AI provider unavailability detected. Check provider status."
            });
        }

        // Sudden increase in request volume

        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);

        const yesterdayDate = yesterday.toISOString().slice(0, 10);

        const yesterdayRequests = records.filter(record =>
            record.date && record.date.startsWith(yesterdayDate)
        ).length;

        const todayRequests = dailyRecords.length;

        if (
            todayRequests >= 10 &&
            todayRequests >= Math.max(1, yesterdayRequests * 2)
        ) {
            alerts.push({
                type: "warning",
                message: "AI request volume has increased significantly compared with yesterday."
            });
        }

        // Calculate weekly usage (last 7 days)

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

        const weeklyRecords = records.filter(record =>
            record.date && new Date(record.date) >= sevenDaysAgo
        );

        // Reusable reporting summary

        const summarizeRecords = (items) => {
            const successful = items.filter(record =>
                record.status === "success"
            );

            const failed = items.filter(record =>
                record.status === "failed"
            );

            const spending = items.reduce(
                (sum, record) => sum + (Number(record.cost) || 0), 0
            );

            const tokens = items.reduce(
                (sum, record) => sum + (Number(record.totalTokens) || 0), 0
            );

            const averageCost = successful.length > 0
                ? successful.reduce(
                    (sum, record) => sum + (Number(record.cost) || 0), 0
                ) / successful.length
                : 0;

            const averageResponseTime = successful.length > 0
                ? successful.reduce(
                    (sum, record) => sum + (Number(record.responseTimeMs) || 0), 0
                ) / successful.length
                : 0;

            return {
                totalRequests: items.length,
                successfulRequests: successful.length,
                failedRequests: failed.length,
                totalTokens: tokens,
                totalSpending: spending,
                averageGenerationCost: averageCost,
                averageResponseTimeMs: averageResponseTime
            };
        };


// Group monthly requests by model

const modelUsage = {};

monthlyRecords.forEach(record => {
    const model = record.model || "Unknown";

    if (!modelUsage[model]) {
        modelUsage[model] = {
            requests: 0,
            tokens: 0,
            spending: 0,
            failures: 0
        };
    }

    modelUsage[model].requests++;
    modelUsage[model].tokens += Number(record.totalTokens) || 0;
    modelUsage[model].spending += Number(record.cost) || 0;

    if (record.status === "failed") {
        modelUsage[model].failures++;
    }
});

        // Group monthly requests by provider

        const providerUsage = {};

        monthlyRecords.forEach(record => {
            const provider = record.provider || "Unknown";

            if (!providerUsage[provider]) {
                providerUsage[provider] = {
                    requests: 0,
                    tokens: 0,
                    spending: 0,
                    failures: 0
                };
            }

            providerUsage[provider].requests++;
            providerUsage[provider].tokens += Number(record.totalTokens) || 0;
            providerUsage[provider].spending += Number(record.cost) || 0;

            if (record.status === "failed") {
                providerUsage[provider].failures++;
            }
        });

        // Send email notifications for detected monitoring alerts

        await sendMonitoringAlertEmails(alerts);

        res.json({
            dailySummary: summarizeRecords(dailyRecords),
            weeklySummary: summarizeRecords(weeklyRecords),

            monthlySummary: {
            ...summarizeRecords(monthlyRecords),
            monthlyBudget,
            models: modelUsage,
            providers: providerUsage
        },

            totalRequests,
            successfulRequests,
            failedRequests,
            totalTokens,
            totalSpending,
            monthlyBudget,
            records: monthlyRecords.slice().reverse(),
            alerts
        });

    } catch (error) {
        console.error("Monitoring data retrieval failed:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve AI monitoring data."
        });
    }
});

// Automated AI usage report schedules
// All schedules run using Nigeria time.

cron.schedule("0 7 * * *", async () => {
    console.log("Running scheduled daily AI report...");
    await sendUsageReport("daily");
}, {
    timezone: "Africa/Lagos"
});

cron.schedule("0 7 * * 1", async () => {
    console.log("Running scheduled weekly AI report...");
    await sendUsageReport("weekly");
}, {
    timezone: "Africa/Lagos"
});

cron.schedule("0 7 1 * *", async () => {
    console.log("Running scheduled monthly AI report...");
    await sendUsageReport("monthly");
}, {
    timezone: "Africa/Lagos"
});

app.listen(PORT, () => {
    console.log(`Agora AI server running on port ${PORT}`);
});
