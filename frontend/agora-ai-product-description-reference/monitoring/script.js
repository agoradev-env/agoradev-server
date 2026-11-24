const API_URL = "/api/monitoring";

async function loadMonitoringData() {
    try {
        const response = await fetch(API_URL, {
            credentials: "same-origin"
        });

        if (response.status === 401) {
            window.location.href = "/monitoring/login";
            return;
        }

        if (response.status === 403) {
            window.location.href = "/monitoring/access-denied";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to retrieve monitoring data.");
        }

        const data = await response.json();

        updateDashboard(data);

    } catch (error) {
        console.error("Monitoring error:", error);

        document.getElementById("alerts-list").innerHTML =
            "<p>Monitoring data could not be loaded. Please try again.</p>";
    }
}

function updateDashboard(data) {
    document.getElementById("total-requests").textContent =
        data.totalRequests ?? 0;

    document.getElementById("successful-requests").textContent =
        data.successfulRequests ?? 0;

    document.getElementById("failed-requests").textContent =
        data.failedRequests ?? 0;

    document.getElementById("total-tokens").textContent =
        (data.totalTokens ?? 0).toLocaleString();

    document.getElementById("average-response-time").textContent =
        `${Math.round(data.monthlySummary?.averageResponseTimeMs ?? 0).toLocaleString()} ms`;

    document.getElementById("total-spending").textContent =
        `$${(data.totalSpending ?? 0).toFixed(4)}`;

    document.getElementById("monthly-budget").textContent =
        `$${(data.monthlyBudget ?? 0).toFixed(2)}`;

    const spendingPercentage = data.monthlyBudget > 0
        ? (data.totalSpending / data.monthlyBudget) * 100
        : 0;

    document.getElementById("budget-progress").style.width =
        `${Math.min(spendingPercentage, 100)}%`;

    updateBudgetAlert(spendingPercentage);
    updateUsageActivity(data.records ?? []);
    updateModelUsageTable(data.records ?? []);
    updateAlerts(data.alerts ?? []);
}

function updateBudgetAlert(percentage) {
    const alert = document.getElementById("budget-alert");

    if (percentage >= 100) {
    alert.textContent = "Monthly AI monitoring budget reached. Arrange additional funding.";
    } else if (percentage >= 90) {
        alert.textContent = "Critical: 90% of the monthly budget has been used.";
    } else if (percentage >= 70) {
        alert.textContent = "Warning: 70% of the monthly budget has been used.";
    } else {
        alert.textContent = `${percentage.toFixed(1)}% of the monthly budget used.`;
    }
}

function updateUsageActivity(records) {
    const successful = records.filter(
        record => record.status === "success"
    );

    const failed = records.filter(
        record => record.status === "failed"
    );

    document.getElementById("success-count").textContent =
        successful.length;

    document.getElementById("failed-count").textContent =
        failed.length;
}

function updateAlerts(alerts) {
    const container = document.getElementById("alerts-list");

    if (alerts.length === 0) {
        container.innerHTML = "<p>No alerts at the moment.</p>";
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <p>${alert.message}</p>
    `).join("");
}

function updateModelUsageTable(records) {
    const table = document.getElementById("model-usage-table");
    const providerFilter = document.getElementById("provider-filter");

    const providers = [
        ...new Set(records.map(record => record.provider || "Unknown"))
    ].sort();

    const selectedProvider = providerFilter.value || "all";

    providerFilter.innerHTML = `
        <option value="all">All Providers</option>
        ${providers.map(provider => `
            <option value="${provider}">${provider}</option>
        `).join("")}
    `;

    providerFilter.value = providers.includes(selectedProvider)
        ? selectedProvider
        : "all";

    const filteredRecords = providerFilter.value === "all"
        ? records
        : records.filter(record =>
            (record.provider || "Unknown") === providerFilter.value
        );

    const modelUsage = {};

    filteredRecords.forEach(record => {
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

    const modelEntries = Object.entries(modelUsage);

    if (modelEntries.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No model usage records yet.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = modelEntries.map(([model, stats]) => `
        <tr>
            <td>${model}</td>
            <td>${stats.requests}</td>
            <td>${stats.tokens.toLocaleString()}</td>
            <td>$${stats.spending.toFixed(4)}</td>
            <td>${stats.failures}</td>
        </tr>
    `).join("");
}

// Load monitoring data when the dashboard opens
loadMonitoringData();

// Automatically refresh monitoring data every 2 minutes
setInterval(loadMonitoringData, 120000);

// Update table when provider selection changes
document.getElementById("provider-filter").addEventListener("change", () => {
    loadMonitoringData();
});
