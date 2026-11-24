const API_URL = "/api/monitoring";

let allActivityRecords = [];
let currentFilter = "all";

async function loadActivity() {
    const table = document.getElementById("activity-table");

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
            throw new Error("Unable to retrieve activity records.");
        }

        const data = await response.json();
        allActivityRecords = data.records ?? [];

        updateActivitySummary(allActivityRecords);
        displayActivity();

    } catch (error) {
        console.error("Activity loading error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="7">Unable to load request records.</td>
            </tr>
        `;
    }
}

function displayActivity() {
    const table = document.getElementById("activity-table");

    const filteredRecords = allActivityRecords.filter(record => {
        return currentFilter === "all" ||
            record.status === currentFilter;
    });

    if (filteredRecords.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No matching requests found.</td>
            </tr>
        `;
        return;
    }

    table.innerHTML = filteredRecords.map((record, index) => {
        const readableDate = record.date
            ? new Date(record.date).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
            : "—";

        const fullId = record.requestId ?? "—";

        const shortId = fullId.length > 12
            ? `${fullId.slice(0, 8)}...`
            : fullId;

        const status = record.status ?? "Unknown";

        const provider = record.provider
            ? record.provider.toUpperCase()
            : "—";

        const details = `
            <strong>Request details</strong>
            <p><strong>Full Request ID:</strong> ${escapeHTML(fullId)}</p>
            <p><strong>Provider:</strong> ${escapeHTML(provider)}</p>
            <p><strong>Model:</strong> ${escapeHTML(record.model ?? "—")}</p>
            <p>Input tokens: ${Number(record.inputTokens ?? 0).toLocaleString()}</p>
            <p>Output tokens: ${Number(record.outputTokens ?? 0).toLocaleString()}</p>
            <p>Cached input tokens: ${Number(record.cachedInputTokens ?? 0).toLocaleString()}</p>
            <p>Response time: ${Number(record.responseTimeMs ?? 0).toLocaleString()} ms</p>
            ${status === "failed" ? `
                <p><strong>Failure reason:</strong></p>
                <p>${escapeHTML(record.error || "No failure details recorded.")}</p>
            ` : ""}
        `;

        return `
            <tr>
                <td>${escapeHTML(readableDate)}</td>

                <td title="${escapeHTML(fullId)}">
                    ${escapeHTML(shortId)}
                </td>

                <td>${escapeHTML(provider)}</td>

                <td>${escapeHTML(record.model ?? "—")}</td>

                <td>${Number(record.totalTokens ?? 0).toLocaleString()}</td>

                <td>$${Number(record.cost ?? 0).toFixed(4)}</td>

                <td class="${status === "success" ? "status-success" : "status-failed"}">
                    ${escapeHTML(status)}

                    <button
                        type="button"
                        class="details-toggle"
                        data-index="${index}"
                    >
                        View details
                    </button>
                </td>
            </tr>

            <tr class="details-row" id="details-${index}" hidden>
                <td colspan="7">
                    ${details}
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll(".details-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const detailsRow = document.getElementById(
                `details-${button.dataset.index}`
            );

            detailsRow.hidden = !detailsRow.hidden;

            button.textContent = detailsRow.hidden
                ? "View details"
                : "Hide details";
        });
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function updateActivitySummary(records) {
    const successful = records.filter(
        record => record.status === "success"
    );

    const failed = records.filter(
        record => record.status === "failed"
    );

    const totalTokens = records.reduce(
        (sum, record) => sum + Number(record.totalTokens ?? 0), 0
    );

    const totalCost = records.reduce(
        (sum, record) => sum + Number(record.cost ?? 0), 0
    );

    document.getElementById("activity-total").textContent =
        records.length.toLocaleString();

    document.getElementById("activity-success").textContent =
        successful.length.toLocaleString();

    document.getElementById("activity-failed").textContent =
        failed.length.toLocaleString();

    document.getElementById("activity-tokens").textContent =
        totalTokens.toLocaleString();

    document.getElementById("activity-cost").textContent =
        `$${totalCost.toFixed(4)}`;
}

document.querySelectorAll(".filter-button").forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter-button").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        displayActivity();
    });
});

loadActivity();
