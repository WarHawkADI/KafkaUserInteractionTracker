let currentPage = 1;
const rowsPerPage = 5;
let allData = []; // Store all interaction data globally
let filteredData = []; // Store filtered data
let apiHitCount = 0; // Counter to track API hits

// ✅ Calculate Gini Coefficient
function calculateGiniCoefficient(data) {
    const actions = data.map(interaction => interaction.actionCount || 1); // Use actionCount
    const n = actions.length;
    if (n === 0) return 0;

    const sortedActions = actions.sort((a, b) => a - b);
    const sumActions = sortedActions.reduce((acc, val) => acc + val, 0);
    const meanActions = sumActions / n;

    let giniSum = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            giniSum += Math.abs(sortedActions[i] - sortedActions[j]);
        }
    }

    const gini = giniSum / (2 * n * n * meanActions);
    return gini;
}

// ✅ Update Statistics
function updateStats() {
    // Calculate actionCount for each user
    const userActionCounts = {};
    filteredData.forEach(interaction => {
        const user = interaction.userName;
        userActionCounts[user] = (userActionCounts[user] || 0) + 1;
    });

    // Add actionCount to each interaction
    filteredData = filteredData.map(interaction => ({
        ...interaction,
        actionCount: userActionCounts[interaction.userName]
    }));

    const totalActions = filteredData.length;
    const userSet = new Set(filteredData.map(interaction => interaction.userName));

    // Calculate Gini Coefficient
    const gini = calculateGiniCoefficient(filteredData);
    const giniPercentage = (gini * 100).toFixed(2); // Convert to percentage

    document.getElementById("totalActions").textContent = totalActions;
    document.getElementById("totalUsers").textContent = userSet.size;
    document.getElementById("usersWithActions").textContent = userSet.size;
    document.getElementById("actionsPerUser").textContent = userSet.size ? (totalActions / userSet.size).toFixed(2) : 0;
    document.getElementById("giniPercentage").textContent = `${giniPercentage}%`; // Display Gini Percentage
    document.getElementById("apiHitCount").textContent = apiHitCount; // Update API hit count
}

// ✅ Load Interactions from API
async function loadInteractions() {
    apiHitCount++; // Increment the counter
    console.log(`API hit count: ${apiHitCount}`); // Log the count (optional)

    console.log("Fetching latest interactions...");

    try {
        const response = await fetch("http://localhost:9090/api/interactions");

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        allData = await response.json();
        console.log("Data received:", allData);

        populateFilterOptions(); // Populate dropdowns dynamically
        applyFilter(); // Apply filter to update UI
    } catch (error) {
        console.error("Error loading interactions:", error);
        alert(`Failed to load interactions: ${error.message}`);
    }
}

// ✅ Dynamically Populate Filter Options
function populateFilterOptions() {
    const userFilter = document.getElementById("userFilter");
    const actionFilter = document.getElementById("actionFilter");
    const roleFilter = document.getElementById("roleFilter");
    const pageFilter = document.getElementById("pageFilter");

    userFilter.innerHTML = `<option value="">All Users</option>`;
    actionFilter.innerHTML = `<option value="">All Actions</option>`;
    roleFilter.innerHTML = `<option value="">All Roles</option>`;
    pageFilter.innerHTML = `<option value="">All Pages</option>`;

    const users = new Set();
    const actions = new Set();
    const roles = new Set();
    const pages = new Set();

    allData.forEach(interaction => {
        users.add(interaction.userName);
        actions.add(interaction.actionType);
        roles.add(interaction.userRole);
        pages.add(interaction.pageName);
    });

    users.forEach(user => userFilter.innerHTML += `<option value="${user}">${user}</option>`);
    actions.forEach(action => actionFilter.innerHTML += `<option value="${action}">${action}</option>`);
    roles.forEach(role => roleFilter.innerHTML += `<option value="${role}">${role}</option>`);
    pages.forEach(page => pageFilter.innerHTML += `<option value="${page}">${page}</option>`);
}

// ✅ Apply Filters
function applyFilter() {
    console.log("Applying filters...");

    const selectedUser = document.getElementById("userFilter").value;
    const selectedAction = document.getElementById("actionFilter").value;
    const selectedRole = document.getElementById("roleFilter").value;
    const selectedPage = document.getElementById("pageFilter").value;

    filteredData = allData.filter(interaction =>
        (selectedUser === "" || interaction.userName === selectedUser) &&
        (selectedAction === "" || interaction.actionType === selectedAction) &&
        (selectedRole === "" || interaction.userRole === selectedRole) &&
        (selectedPage === "" || interaction.pageName === selectedPage)
    );

    console.log("Filtered Data:", filteredData);

    currentPage = 1;
    updateTable();
    updateStats();
    updateCharts();
    updatePageRankingChart();
    updateRolePieChart(); // Update the new pie chart
}

// ✅ Update Table with Pagination
function updateTable() {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6">No interactions found.</td></tr>`;
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(start, end);

    pageData.forEach((interaction, index) => {
        let row = `<tr>
            <td>${start + index + 1}</td>
            <td>${interaction.userName || "N/A"}</td>
            <td>${interaction.userRole || "N/A"}</td>
            <td>${interaction.actionType || "N/A"}</td>
            <td><button class="page-button" onclick="redirectToDetails('${interaction.userName}', '${interaction.pageName}')">${interaction.pageName || "N/A"}</button></td>
            <td>${interaction.timestamp || "N/A"}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    updatePaginationButtons();
}

// ✅ Redirect to User Page Details in a New Tab
function redirectToDetails(user, page) {
    window.open(`user-page-details.html?user=${encodeURIComponent(user)}&page=${encodeURIComponent(page)}`, "_blank");
}

// ✅ Update Pagination Buttons
function updatePaginationButtons() {
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage * rowsPerPage >= filteredData.length;
}

// ✅ Pagination Controls
document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage * rowsPerPage < filteredData.length) {
        currentPage++;
        updateTable();
    }
});

// ✅ Update Charts
function updateCharts() {
    const actionCounts = {};
    const dailyActions = {};

    filteredData.forEach(interaction => {
        actionCounts[interaction.actionType] = (actionCounts[interaction.actionType] || 0) + 1;

        const date = interaction.timestamp.split("T")[0]; // Extract YYYY-MM-DD
        dailyActions[date] = (dailyActions[date] || 0) + 1;
    });

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
            maintainAspectRatio: false
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
            maintainAspectRatio: false
        }
    });
}

// ✅ Update Page Ranking Chart
function updatePageRankingChart() {
    const pageCounts = {};

    // Count actions by page
    filteredData.forEach(interaction => {
        const page = interaction.pageName || "Unknown Page";
        pageCounts[page] = (pageCounts[page] || 0) + 1;
    });

    // Sort pages by action count (descending)
    const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
    const topPages = sortedPages.slice(0, 5); // Get top 5 pages

    // Extract labels and data for the chart
    const labels = topPages.map(([page]) => page);
    const data = topPages.map(([, count]) => count);

    // Destroy existing chart instance if it exists
    if (window.pageRankingChartInstance) {
        window.pageRankingChartInstance.destroy();
    }

    // Create the chart
    const ctx = document.getElementById("pageRankingChart").getContext("2d");
    window.pageRankingChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Actions",
                data: data,
                backgroundColor: "#007bff", // Blue bars
                borderColor: "#0056b3",
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: "y", // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Hide legend
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const rank = context.dataIndex + 1; // Calculate rank
                            return `Rank ${rank}: ${context.raw} actions`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Number of Actions"
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Page"
                    }
                }
            }
        }
    });
}

// ✅ Update Role Pie Chart
function updateRolePieChart() {
    const roleCounts = {};

    // Count users by role
    filteredData.forEach(interaction => {
        const role = interaction.userRole || "Unknown Role";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // Extract labels and data for the chart
    const labels = Object.keys(roleCounts);
    const data = Object.values(roleCounts);

    // Destroy existing chart instance if it exists
    if (window.rolePieChartInstance) {
        window.rolePieChartInstance.destroy();
    }

    // Create the chart
    const ctx = document.getElementById("rolePieChart").getContext("2d");
    window.rolePieChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [{
                label: "Users by Role",
                data: data,
                backgroundColor: [
                    "#4e79a7", // Soft blue
                    "#f28e2b", // Orange
                    "#e15759", // Red
                    "#76b7b2", // Teal
                    "#59a14f", // Green
                    "#edc948", // Yellow
                    "#b07aa1", // Purple
                    "#ff9da7", // Pink
                    "#9c755f", // Brown
                    "#bab0ac"  // Gray
                ],
                borderColor: "#1e1e2e",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#ffffff" // White text for legend
                    }
                }
            }
        }
    });
}

// ✅ Send Interactions
document.getElementById("sendInteractionsButton").addEventListener("click", async function () {
    console.log("Sending interactions...");

    try {
        const response = await fetch("http://localhost:9090/api/interactions/send-from-file", { method: "POST" });

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        alert("Interactions sent successfully!");
        loadInteractions();
    } catch (error) {
        console.error("Error sending interactions:", error);
        alert(`Failed to send interactions: ${error.message}`);
    }
});

// ✅ Ensure Apply Filter Button Works
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("applyFilterButton").addEventListener("click", applyFilter);
});

// ✅ Auto-refresh every 5 seconds
document.addEventListener("DOMContentLoaded", function () {
    loadInteractions();
    setInterval(loadInteractions, 5000);

    document.getElementById("refreshButton").addEventListener("click", loadInteractions);
});