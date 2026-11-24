const detailsContainer = document.getElementById("detailsContainer");
const addDetailButton = document.getElementById("addDetailButton");
const productForm = document.getElementById("productForm");
const newProductButton = document.getElementById("newProductButton");

let currentProductId = crypto.randomUUID();

const generatedDescription = document.getElementById("generatedDescription");
const reviewControls = document.getElementById("reviewControls");
const regenerateButton = document.getElementById("regenerateButton");
const acceptButton = document.getElementById("acceptButton");
const reviewStatus = document.getElementById("reviewStatus");
const attemptsRemainingElement = document.getElementById("attemptsRemaining");

let descriptionAccepted = false;

let remainingAttempts = 3;

// Update the seller's remaining AI generation attempts

function updateAttemptsDisplay(remaining) {
    remainingAttempts = remaining;

    attemptsRemainingElement.textContent =
        `${remaining} AI attempt${remaining === 1 ? "" : "s"} remaining for this product.`;

    const usageHint = document.querySelector(".usage-hint");
    const manualEditHint = document.querySelector(".manual-edit-hint");
    const generateButton = document.getElementById("generateButton");

    if (remaining === 0) {
        attemptsRemainingElement.textContent =
            "You have used all 3 AI attempts for this product. You can still edit your description manually.";

        regenerateButton.disabled = true;
        generateButton.disabled = true;

        if (usageHint) {
            usageHint.hidden = true;
        }

        if (manualEditHint) {
            manualEditHint.hidden = true;
        }

        reviewStatus.textContent = "";

    } else {
        regenerateButton.disabled = false;
        generateButton.disabled = false;

        if (usageHint) {
            usageHint.hidden = false;

        if (manualEditHint) {
            manualEditHint.hidden = false;
        }
        }

        if (manualEditHint) {
            manualEditHint.textContent =
                "You can edit the generated description manually at any time. Regenerating uses one of your remaining AI attempts.";
        }
    }
}

// Start a new product listing
newProductButton.addEventListener("click", function () {
    currentProductId = crypto.randomUUID();

    productForm.reset();

    const detailRows = document.querySelectorAll(".detail-row");

    detailRows.forEach(function (row, index) {
        if (index > 0) {
            row.remove();
        }
    });

    generatedDescription.value = "";
    reviewControls.hidden = true;
    reviewStatus.textContent = "";

    descriptionAccepted = false;

    updateAttemptsDisplay(3);

    acceptButton.disabled = true;
    regenerateButton.disabled = true;
    addDetailButton.disabled = false;

    console.log("New product listing started:", currentProductId);
});

// Add another product detail row
addDetailButton.addEventListener("click", function () {
    const detailRow = document.createElement("div");

    detailRow.classList.add("detail-row");

    detailRow.innerHTML = `
        <input
            type="text"
            class="detail-name"
            placeholder="Detail name (e.g. Material)"
        >

        <input
            type="text"
            class="detail-value"
            placeholder="Value (e.g. Genuine leather)"
        >
    `;

    detailsContainer.appendChild(detailRow);
});

// Collect product information
function collectProductData() {
    const productData = {
        productId: currentProductId,
        productName: document.getElementById("productName").value.trim(),
        productCategory: document.getElementById("productCategory").value.trim(),
        productDetails: []
    };

    const detailRows = document.querySelectorAll(".detail-row");

    detailRows.forEach(function (row) {
        const name = row.querySelector(".detail-name").value.trim();
        const value = row.querySelector(".detail-value").value.trim();

        if (name && value) {
            productData.productDetails.push({
                name: name,
                value: value
            });
        }
    });

    return productData;
}

// Generate or regenerate a product description
async function generateDescription() {
    const productData = collectProductData();

    if (!productData.productName || !productData.productCategory) {
        alert("Please enter the product name and category.");
        return;
    }

    descriptionAccepted = false;
    reviewStatus.textContent = "";
    acceptButton.disabled = true;
    regenerateButton.disabled = true;
    addDetailButton.disabled = true;

    generatedDescription.value = "Generating description...";

    try {
        const response = await fetch("/generate-description", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        // Update the remaining attempts using the backend response
        if (Number.isInteger(result.attemptsRemaining)) {
            updateAttemptsDisplay(result.attemptsRemaining);
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Description generation failed.");
        }

        generatedDescription.value = result.description;

        reviewControls.hidden = false;

        if (remainingAttempts > 0) {
            reviewStatus.textContent = "New description generated. Review it before accepting.";
        } else {
            reviewStatus.textContent = "";
        }

        console.log("Generated description:", result.description);

    } catch (error) {
        console.error("Error generating description:", error.message);

        generatedDescription.value = "";
        reviewStatus.textContent = error.message || "Unable to generate a description. Please try again.";}

    finally {
        regenerateButton.disabled = remainingAttempts <= 0;
        acceptButton.disabled = false;
        addDetailButton.disabled = false;
    }
}

// Generate the initial description
productForm.addEventListener("submit", function (event) {
    event.preventDefault();
    generateDescription();
});

// Regenerate using existing product information
regenerateButton.addEventListener("click", function () {
    generateDescription();
});

// Accept the current description
acceptButton.addEventListener("click", function () {
    const description = generatedDescription.value.trim();

    if (!description || description === "Generating description...") {
        reviewStatus.textContent = "Please generate a description before accepting.";
        return;
    }

    descriptionAccepted = true;

    reviewStatus.textContent = "Description accepted! You can continue with your product listing.";

    acceptButton.disabled = true;

    console.log("Accepted product description:", description);
});
