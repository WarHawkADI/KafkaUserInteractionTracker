let currentPage = 1;
const rowsPerPage = 5   ;
let allData = []; // Store all interaction data globally

async function loadInteractions() {
    console.log("Fetching latest interactions...");

    try {
        const response = await fetch("http://localhost:9090/api/interactions");

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Data received:", data);
        allData = data; // Store data globally for pagination

        updateTable();
        updateStats(); // ✅ Now defined
        updateCharts(); // ✅ Now defined

    } catch (error) {
        console.error("Error loading interactions:", error);
        alert(`Failed to load interactions: ${error.message}`);
    }
}

// ✅ Update Table with Pagination
function updateTable() {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    if (allData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6">No interactions found.</td></tr>`;
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, allData.length);
    const pageData = allData.slice(start, end);

    pageData.forEach((interaction, index) => {
        let row = `<tr>
            <td>${start + index + 1}</td>
            <td>${interaction.userName || "N/A"}</td>
            <td>${interaction.userRole || "N/A"}</td>
            <td>${interaction.actionType || "N/A"}</td>
            <td>${interaction.pageName || "N/A"}</td>
            <td>${interaction.timestamp || "N/A"}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    updatePaginationButtons();
}

// ✅ Update Pagination Buttons
function updatePaginationButtons() {
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage * rowsPerPage >= allData.length;
}

document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage * rowsPerPage < allData.length) {
        currentPage++;
        updateTable();
    }
});

// ✅ Update Statistics
function updateStats() {
    const totalActions = allData.length;
    const userSet = new Set(allData.map(interaction => interaction.userName));

    document.getElementById("totalActions").textContent = totalActions;
    document.getElementById("totalUsers").textContent = userSet.size;
    document.getElementById("usersWithActions").textContent = userSet.size;
    document.getElementById("actionsPerUser").textContent = userSet.size ? (totalActions / userSet.size).toFixed(2) : 0;
}

// ✅ Update Charts (Includes Total Actions by Day)
function updateCharts() {
    const actionCounts = {};
    const dailyActions = {};

    allData.forEach(interaction => {
        actionCounts[interaction.actionType] = (actionCounts[interaction.actionType] || 0) + 1;

        const date = interaction.timestamp.split("T")[0]; // Extract YYYY-MM-DD
        dailyActions[date] = (dailyActions[date] || 0) + 1;
    });

    // ✅ Destroy old charts before rendering new ones
    if (window.actionChartInstance) window.actionChartInstance.destroy();
    if (window.dailyChartInstance) window.dailyChartInstance.destroy();

    // ✅ Bar Chart - Actions Performed
    window.actionChartInstance = new Chart(document.getElementById("actionChart"), {
        type: "bar",
        data: {
            labels: Object.keys(actionCounts),
            datasets: [{
                label: "Actions Performed",
                data: Object.values(actionCounts),
                backgroundColor: "#007bff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: "Action Type" } },
                y: { title: { display: true, text: "Count" }, beginAtZero: true }
            }
        }
    });

    // ✅ Line Chart - Total Actions by Day
    window.dailyChartInstance = new Chart(document.getElementById("dailyActionChart"), {
        type: "line",
        data: {
            labels: Object.keys(dailyActions),
            datasets: [{
                label: "Total Actions per Day",
                data: Object.values(dailyActions),
                borderColor: "#28a745",
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Actions" }, beginAtZero: true }
            }
        }
    });
}

// ✅ Send Interactions (Fixed JSON Issue)
document.getElementById("sendInteractionsButton").addEventListener("click", async function () {
    console.log("Sending interactions...");

    try {
        const response = await fetch("http://localhost:9090/api/interactions/send-from-file", {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        let message;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            message = data.message || "Interactions sent successfully!";
        } else {
            message = "Interactions sent successfully!";
        }

        alert(message);
        loadInteractions();
    } catch (error) {
        console.error("Error sending interactions:", error);
        alert(`Failed to send interactions: ${error.message}`);
    }
});

// ✅ Auto-refresh every 5 seconds
document.addEventListener("DOMContentLoaded", function () {
    loadInteractions();
    setInterval(loadInteractions, 5000);

    document.getElementById("refreshButton").addEventListener("click", loadInteractions);
});
