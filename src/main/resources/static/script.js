// Global variables
let currentPage = 1;
const rowsPerPage = 5;
let allData = [];
let filteredData = [];
let apiHitCount = 0;
let socket = null;
let stompClient = null;
let isConnected = false;
const maxReconnectAttempts = 5;
let reconnectAttempts = 0;
let reconnectInterval = null;
let chartInstances = {};

// WebSocket Functions
function initWebSocket() {
    // Create SockJS connection
    socket = new SockJS('http://localhost:9090/ws-interactions');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log('WebSocket connected:', frame);
        isConnected = true;
        updateConnectionStatus('🟢 Connected');
        clearReconnectAttempts();

        // Subscribe to interactions topic
        stompClient.subscribe('/topic/interactions', function(message) {
            const newData = JSON.parse(message.body);
            handleNewData(newData);
        });
    }, function(error) {
        console.error('WebSocket error:', error);
        isConnected = false;
        updateConnectionStatus('🔴 Disconnected');
        handleReconnect();
    });
}

function handleNewData(newData) {
    // Save current filter values
    const currentFilters = {
        user: document.getElementById("userFilter").value,
        action: document.getElementById("actionFilter").value,
        role: document.getElementById("roleFilter").value,
        page: document.getElementById("pageFilter").value
    };

    // Update allData with new data
    allData = newData;

    // Reapply filters
    applyFilters(currentFilters);

    // Update UI
    updateUI();
}

function applyFilters({user, action, role, page}) {
    filteredData = allData.filter(interaction =>
        (user === "" || interaction.userName === user) &&
        (action === "" || interaction.actionType === action) &&
        (role === "" || interaction.userRole === role) &&
        (page === "" || interaction.pageName === page)
    );

    // Ensure current page is valid
    const maxPage = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
    currentPage = Math.min(currentPage, maxPage);
}

function updateUI() {
    populateFilterOptions();
    updateTable();
    updateStats();
    updateCharts();
}

function handleReconnect() {
    if (!reconnectInterval && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * reconnectAttempts, 10000); // Exponential backoff
        reconnectInterval = setTimeout(() => {
            console.log(`Reconnecting attempt ${reconnectAttempts}...`);
            initWebSocket();
        }, delay);
    }
}

function clearReconnectAttempts() {
    reconnectAttempts = 0;
    if (reconnectInterval) {
        clearTimeout(reconnectInterval);
        reconnectInterval = null;
    }
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) {
        // Create status element if it doesn't exist
        const newStatusElement = document.createElement('div');
        newStatusElement.id = 'connectionStatus';
        newStatusElement.style.position = 'fixed';
        newStatusElement.style.bottom = '10px';
        newStatusElement.style.right = '10px';
        newStatusElement.style.padding = '5px 10px';
        newStatusElement.style.backgroundColor = status.includes('🟢') ? '#4CAF50' : '#F44336';
        newStatusElement.style.color = 'white';
        newStatusElement.style.borderRadius = '5px';
        newStatusElement.style.zIndex = '1000';
        newStatusElement.textContent = status;
        document.body.appendChild(newStatusElement);
    } else {
        statusElement.textContent = status;
        statusElement.style.backgroundColor = status.includes('🟢') ? '#4CAF50' : '#F44336';
    }
}

// Data Loading
async function loadInteractions() {
    if (!isConnected) {
        apiHitCount++;
        try {
            const response = await fetch("http://localhost:9090/api/interactions");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const newData = await response.json();
            handleNewData(newData);
        } catch (error) {
            console.error("Error loading interactions:", error);
            updateConnectionStatus('🔴 API Fallback Failed');
        }
    }
}

// Filter Functions
function populateFilterOptions() {
    const filters = [
        { id: "userFilter", key: "userName" },
        { id: "actionFilter", key: "actionType" },
        { id: "roleFilter", key: "userRole" },
        { id: "pageFilter", key: "pageName" }
    ];

    filters.forEach(filter => {
        const element = document.getElementById(filter.id);
        if (!element) return;

        // Save current selection
        const currentValue = element.value;

        // Reset options
        element.innerHTML = `<option value="">All ${filter.key.replace(/([A-Z])/g, ' $1').trim()}</option>`;

        // Add unique values
        const uniqueValues = [...new Set(allData.map(item => item[filter.key]))].filter(Boolean);
        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            element.appendChild(option);
        });

        // Restore selection if still valid
        if (uniqueValues.includes(currentValue)) {
            element.value = currentValue;
        }
    });
}

function applyFilter() {
    const currentFilters = {
        user: document.getElementById("userFilter").value,
        action: document.getElementById("actionFilter").value,
        role: document.getElementById("roleFilter").value,
        page: document.getElementById("pageFilter").value
    };

    applyFilters(currentFilters);
    updateUI();
}

// Table Functions
function updateTable() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6">No interactions found.</td></tr>`;
        updatePaginationButtons();
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(start, end);

    tableBody.innerHTML = pageData.map((interaction, index) => `
        <tr>
            <td>${start + index + 1}</td>
            <td>${interaction.userName || "N/A"}</td>
            <td>${interaction.userRole || "N/A"}</td>
            <td>${interaction.actionType || "N/A"}</td>
            <td>
                <button class="page-button" 
                        onclick="redirectToDetails('${interaction.userName}', '${interaction.pageName}')">
                    ${interaction.pageName || "N/A"}
                </button>
            </td>
            <td>${new Date(interaction.timestamp).toLocaleString() || "N/A"}</td>
        </tr>
    `).join('');

    updatePaginationButtons();
}

function redirectToDetails(user, page) {
    window.open(`user-page-details.html?user=${encodeURIComponent(user)}&page=${encodeURIComponent(page)}`, "_blank");
}

function updatePaginationButtons() {
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage * rowsPerPage >= filteredData.length;
    }
}

// Stats Functions
function calculateGiniCoefficient(data) {
    const actions = data.map(interaction => interaction.actionCount || 1);
    const n = actions.length;
    if (n === 0) return 0;

    const sortedActions = [...actions].sort((a, b) => a - b);
    const sumActions = sortedActions.reduce((acc, val) => acc + val, 0);
    const meanActions = sumActions / n;

    let giniSum = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            giniSum += Math.abs(sortedActions[i] - sortedActions[j]);
        }
    }

    return giniSum / (2 * n * n * meanActions);
}

function updateStats() {
    const userActionCounts = {};
    filteredData.forEach(interaction => {
        const user = interaction.userName;
        userActionCounts[user] = (userActionCounts[user] || 0) + 1;
    });

    filteredData = filteredData.map(interaction => ({
        ...interaction,
        actionCount: userActionCounts[interaction.userName]
    }));

    const totalActions = filteredData.length;
    const userSet = new Set(filteredData.map(interaction => interaction.userName));
    const gini = calculateGiniCoefficient(filteredData);
    const giniPercentage = (gini * 100).toFixed(2);

    document.getElementById("totalActions").textContent = totalActions;
    document.getElementById("totalUsers").textContent = userSet.size;
    document.getElementById("usersWithActions").textContent = userSet.size;
    document.getElementById("actionsPerUser").textContent = userSet.size ? (totalActions / userSet.size).toFixed(2) : 0;
    document.getElementById("giniPercentage").textContent = `${giniPercentage}%`;
    document.getElementById("apiHitCount").textContent = apiHitCount;
}

// Chart Functions
function updateCharts() {
    updateChart('actionChart', 'bar', 'Actions Performed', "#007bff", 'actionType');
    updateDailyActionChart();
    updateRankingChart('pageRankingChart', 'pageName', 'Page');
    updateRankingChart('rolePieChart', 'userRole', 'Role', 'pie');
}

function updateDailyActionChart() {
    // Group by date and count actions
    const dateCounts = {};
    filteredData.forEach(interaction => {
        const date = interaction.timestamp.split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Convert to array and sort by date
    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    const sortedCounts = sortedDates.map(date => dateCounts[date]);

    // Destroy previous chart instance if exists
    if (chartInstances['dailyActionChart']) {
        chartInstances['dailyActionChart'].destroy();
    }

    const ctx = document.getElementById('dailyActionChart').getContext('2d');
    chartInstances['dailyActionChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Total Actions per Day',
                data: sortedCounts,
                borderColor: "#28a745",
                backgroundColor: "rgba(40, 167, 69, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Actions'
                    }
                }
            }
        }
    });
}

function updateChart(canvasId, type, label, color, property, isDate = false) {
    const counts = {};
    filteredData.forEach(interaction => {
        const key = isDate ? interaction[property].split('T')[0] : interaction[property];
        counts[key] = (counts[key] || 0) + 1;
    });

    // Destroy previous chart instance if exists
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type,
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label,
                data: Object.values(counts),
                backgroundColor: type === 'bar' ? color : undefined,
                borderColor: color,
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateRankingChart(canvasId, property, label, type = 'bar') {
    const counts = {};
    filteredData.forEach(interaction => {
        const key = interaction[property] || `Unknown ${label}`;
        counts[key] = (counts[key] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topItems = type === 'pie' ? sorted : sorted.slice(0, 5);

    // Destroy previous chart instance if exists
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type,
        data: {
            labels: topItems.map(([key]) => key),
            datasets: [{
                label: type === 'pie' ? `Users by ${label}` : 'Actions',
                data: topItems.map(([, count]) => count),
                backgroundColor: type === 'pie' ? [
                    "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
                    "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac"
                ] : "#007bff",
                borderColor: type === 'pie' ? "#1e1e2e" : "#0056b3",
                borderWidth: type === 'pie' ? 2 : 1
            }]
        },
        options: {
            indexAxis: type === 'pie' ? undefined : 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type === 'pie',
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: type === 'pie' ? undefined : (context) =>
                            `Rank ${context.dataIndex + 1}: ${context.raw} actions`
                    }
                }
            },
            scales: type === 'pie' ? undefined : {
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
                        text: label
                    }
                }
            }
        }
    });
}

// Event Listeners
function setupEventListeners() {
    document.getElementById("prevPage")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    document.getElementById("nextPage")?.addEventListener("click", () => {
        if (currentPage * rowsPerPage < filteredData.length) {
            currentPage++;
            updateTable();
        }
    });

    document.getElementById("sendInteractionsButton")?.addEventListener("click", async () => {
        try {
            const response = await fetch("http://localhost:9090/api/interactions/send-from-file", {
                method: "POST"
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            console.log("Interactions sent successfully");
        } catch (error) {
            console.error("Error sending interactions:", error);
        }
    });

    document.getElementById("applyFilterButton")?.addEventListener("click", applyFilter);
    document.getElementById("refreshButton")?.addEventListener("click", loadInteractions);
}

// Initialization
function initializeApp() {
    setupEventListeners();
    initWebSocket();
    loadInteractions();
}

// Start the application
document.addEventListener("DOMContentLoaded", initializeApp);

// Make redirect function available globally
window.redirectToDetails = redirectToDetails;