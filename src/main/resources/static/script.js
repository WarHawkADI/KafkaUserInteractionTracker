// Global variables
const API_BASE_URL = 'http://localhost:9090';
let currentPage = 1;
const rowsPerPage = 5;
let allData = [];
let filteredData = [];
let chartInstances = {};
let stompClient = null;
let socket = null;
let newDataAvailable = false;

// DOM Elements
const elements = {
    tableBody: document.getElementById("tableBody"),
    refreshButton: document.getElementById("refreshButton"),
    sendInteractionsButton: document.getElementById("sendInteractionsButton"),
    applyFilterButton: document.getElementById("applyFilterButton"),
    resetFilterButton: document.getElementById("resetFilterButton"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    pageInfo: document.getElementById("pageInfo"),
    lastRefreshedTime: document.getElementById("lastRefreshedTime"),
    loadingIndicator: document.getElementById("loadingIndicator"),
    errorMessage: document.getElementById("errorMessage"),
    userFilter: document.getElementById("userFilter"),
    actionFilter: document.getElementById("actionFilter"),
    roleFilter: document.getElementById("roleFilter"),
    pageFilter: document.getElementById("pageFilter"),
    startDate: document.getElementById("startDate"),
    endDate: document.getElementById("endDate"),
    totalActions: document.getElementById("totalActions"),
    totalUsers: document.getElementById("totalUsers"),
    usersWithActions: document.getElementById("usersWithActions"),
    actionsPerUser: document.getElementById("actionsPerUser"),
    giniPercentage: document.getElementById("giniPercentage"),
    connectionStatus: document.getElementById("connectionStatus")
};

// Utility functions
function formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleString();
    } catch (e) {
        return dateString;
    }
}

function extractDatePart(dateString) {
    if (!dateString) return "Unknown";
    const datePart = dateString.includes('T')
        ? dateString.split('T')[0]
        : dateString.split(' ')[0];
    return datePart || "Unknown";
}

function normalizeInteraction(interaction) {
    return {
        ...interaction,
        id: interaction.id || Math.random().toString(36).substring(2, 9),
        userName: interaction.userName || "Unknown",
        userRole: interaction.userRole || "Unknown",
        actionType: interaction.actionType || "Unknown",
        pageName: interaction.pageName || "Unknown",
        formattedCreatedAt: formatDate(interaction.createdAt),
        datePart: extractDatePart(interaction.createdAt),
        timestamp: new Date(interaction.createdAt).getTime() || 0
    };
}

// WebSocket functions
function connectWebSocket() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }

    socket = new SockJS(API_BASE_URL + '/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        updateConnectionStatus(true);

        stompClient.subscribe('/topic/notifications', function(message) {
            if (message.body === "NEW_DATA_AVAILABLE") {
                newDataAvailable = true;
                showNotification("New data available! Click Refresh to load.");
                updateRefreshButtonState();
            }
        });
    }, function(error) {
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 5000);
    });
}

function updateConnectionStatus(connected) {
    if (!elements.connectionStatus) return;

    if (connected) {
        elements.connectionStatus.textContent = "WebSocket: Connected";
        elements.connectionStatus.className = "connection-status connected";
    } else {
        elements.connectionStatus.textContent = "WebSocket: Disconnected - Reconnecting...";
        elements.connectionStatus.className = "connection-status disconnected";
    }
}

function updateRefreshButtonState() {
    if (elements.refreshButton) {
        if (newDataAvailable) {
            elements.refreshButton.classList.add("refresh-button-new-data");
            elements.refreshButton.textContent = "Refresh (New Data Available)";
        } else {
            elements.refreshButton.classList.remove("refresh-button-new-data");
            elements.refreshButton.textContent = "Refresh Data";
        }
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Data Loading
async function fetchLatestData() {
    try {
        // Store current state before refresh
        const scrollPosition = window.scrollY;
        const currentPageBeforeRefresh = currentPage;

        showLoadingIndicator(true);
        clearError();

        const response = await fetch(`${API_BASE_URL}/elastic/latest`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const newData = await response.json();
        const normalizedNewData = newData.map(normalizeInteraction);

        // Merge new data with existing data, avoiding duplicates
        const newDataIds = new Set(normalizedNewData.map(item => item.id));
        const existingData = allData.filter(item => !newDataIds.has(item.id));

        allData = [...normalizedNewData, ...existingData];
        newDataAvailable = false;

        setDefaultDateRange();
        applyCurrentFilters();

        // Restore the page position
        currentPage = currentPageBeforeRefresh;

        updateUI();
        updateRefreshButtonState();
        updateLastRefreshedTime();

        // Restore scroll position
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 0);

    } catch (error) {
        console.error("Error loading interactions:", error);
        showError("Failed to load data. Please try again.");
    } finally {
        showLoadingIndicator(false);
    }
}

function setDefaultDateRange() {
    if (allData.length === 0) return;

    const timestamps = allData.map(item => item.timestamp).filter(t => t > 0);
    if (timestamps.length === 0) return;

    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));

    if (elements.startDate) elements.startDate.valueAsDate = minDate;
    if (elements.endDate) elements.endDate.valueAsDate = maxDate;
}

// UI Update functions
function updateUI() {
    populateFilterOptions();
    updateTable();
    updateStats();
    updateCharts();
}

function updateTable() {
    if (!elements.tableBody) return;

    if (filteredData.length === 0) {
        elements.tableBody.innerHTML = `<tr><td colspan="6">No matching interactions found.</td></tr>`;
        updatePaginationButtons();
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(start, end);

    elements.tableBody.innerHTML = pageData.map((interaction, index) => `
        <tr>
            <td>${start + index + 1}</td>
            <td>${interaction.userName}</td>
            <td>${interaction.userRole}</td>
            <td>${interaction.actionType}</td>
            <td>
                <button class="page-button" 
                        onclick="redirectToDetails('${encodeURIComponent(interaction.userName)}', 
                                '${encodeURIComponent(interaction.pageName)}')">
                    ${interaction.pageName}
                </button>
            </td>
            <td>${interaction.formattedCreatedAt}</td>
        </tr>
    `).join('');

    updatePaginationButtons();
}

function updatePaginationButtons() {
    if (elements.prevPage && elements.nextPage && elements.pageInfo) {
        const totalPages = Math.ceil(filteredData.length / rowsPerPage);
        elements.prevPage.disabled = currentPage === 1;
        elements.nextPage.disabled = currentPage >= totalPages;
        elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredData.length} total records)`;
    }
}

function updateStats() {
    if (filteredData.length === 0) {
        if (elements.totalActions) elements.totalActions.textContent = "0";
        if (elements.totalUsers) elements.totalUsers.textContent = "0";
        if (elements.usersWithActions) elements.usersWithActions.textContent = "0";
        if (elements.actionsPerUser) elements.actionsPerUser.textContent = "0";
        if (elements.giniPercentage) elements.giniPercentage.textContent = "0%";
        return;
    }

    const userActionCounts = {};
    filteredData.forEach(interaction => {
        const user = interaction.userName;
        userActionCounts[user] = (userActionCounts[user] || 0) + 1;
    });

    const totalActions = filteredData.length;
    const uniqueUsers = Object.keys(userActionCounts).length;
    const actionsPerUser = uniqueUsers > 0 ? (totalActions / uniqueUsers).toFixed(2) : 0;
    const gini = calculateGiniCoefficient(Object.values(userActionCounts));
    const giniPercentage = (gini * 100).toFixed(2);

    if (elements.totalActions) elements.totalActions.textContent = totalActions;
    if (elements.totalUsers) elements.totalUsers.textContent = uniqueUsers;
    if (elements.usersWithActions) elements.usersWithActions.textContent = uniqueUsers;
    if (elements.actionsPerUser) elements.actionsPerUser.textContent = actionsPerUser;
    if (elements.giniPercentage) elements.giniPercentage.textContent = `${giniPercentage}%`;
}

function calculateGiniCoefficient(values) {
    if (values.length === 0) return 0;

    values.sort((a, b) => a - b);
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    let giniSum = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            giniSum += Math.abs(values[i] - values[j]);
        }
    }

    return giniSum / (2 * n * n * mean);
}

// Filter functions
function applyCurrentFilters() {
    const currentFilters = {
        user: elements.userFilter ? elements.userFilter.value : "",
        action: elements.actionFilter ? elements.actionFilter.value : "",
        role: elements.roleFilter ? elements.roleFilter.value : "",
        page: elements.pageFilter ? elements.pageFilter.value : "",
        startDate: elements.startDate ? elements.startDate.value : "",
        endDate: elements.endDate ? elements.endDate.value : ""
    };

    filteredData = allData.filter(interaction => {
        if (currentFilters.user && interaction.userName !== currentFilters.user) return false;
        if (currentFilters.action && interaction.actionType !== currentFilters.action) return false;
        if (currentFilters.role && interaction.userRole !== currentFilters.role) return false;
        if (currentFilters.page && interaction.pageName !== currentFilters.page) return false;

        if (currentFilters.startDate) {
            const startTimestamp = new Date(currentFilters.startDate).getTime();
            if (interaction.timestamp < startTimestamp) return false;
        }

        if (currentFilters.endDate) {
            const endOfDay = new Date(currentFilters.endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (interaction.timestamp > endOfDay.getTime()) return false;
        }

        return true;
    });
}

function populateFilterOptions() {
    const filters = [
        { id: "userFilter", key: "userName", label: "User" },
        { id: "actionFilter", key: "actionType", label: "Action" },
        { id: "roleFilter", key: "userRole", label: "Role" },
        { id: "pageFilter", key: "pageName", label: "Page" }
    ];

    filters.forEach(filter => {
        const element = document.getElementById(filter.id);
        if (!element) return;

        const currentValue = element.value;
        element.innerHTML = `<option value="">All ${filter.label}</option>`;

        const uniqueValues = [...new Set(allData.map(item => item[filter.key]))]
            .filter(Boolean)
            .sort();

        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            element.appendChild(option);
        });

        if (uniqueValues.includes(currentValue)) {
            element.value = currentValue;
        }
    });
}

// Chart functions
function updateCharts() {
    updateChart('actionChart', 'bar', 'Actions Performed', "#007bff", 'actionType');
    updateDailyActionChart();
    updateRankingChart('pageRankingChart', 'pageName', 'Page');
    updateRankingChart('rolePieChart', 'userRole', 'Role', 'pie');
}

function updateChart(canvasId, type, label, color, property) {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const validData = filteredData.filter(i => i[property]);
        if (validData.length === 0) return;

        const counts = {};
        validData.forEach(interaction => {
            const key = interaction[property];
            counts[key] = (counts[key] || 0) + 1;
        });

        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
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
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: type !== 'bar'
                    }
                }
            }
        });
    } catch (error) {
        console.error(`Error creating ${canvasId} chart:`, error);
    }
}

function updateDailyActionChart() {
    try {
        const canvas = document.getElementById('dailyActionChart');
        if (!canvas) return;

        const dateCounts = {};
        filteredData.forEach(interaction => {
            const date = interaction.datePart;
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });

        const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
        const sortedCounts = sortedDates.map(date => dateCounts[date]);

        if (chartInstances['dailyActionChart']) {
            chartInstances['dailyActionChart'].destroy();
        }

        const ctx = canvas.getContext('2d');
        chartInstances['dailyActionChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Actions per Day',
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
                        title: { display: true, text: 'Date' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Actions' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating daily action chart:', error);
    }
}

function updateRankingChart(canvasId, property, label, type = 'bar') {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const counts = {};
        filteredData.forEach(interaction => {
            const key = interaction[property] || `Unknown ${label}`;
            counts[key] = (counts[key] || 0) + 1;
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topItems = type === 'pie' ? sorted : sorted.slice(0, 5);

        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        const ctx = canvas.getContext('2d');
        chartInstances[canvasId] = new Chart(ctx, {
            type,
            data: {
                labels: topItems.map(([key]) => key),
                datasets: [{
                    label: type === 'pie' ? `By ${label}` : 'Actions',
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
                                `${context.label}: ${context.raw} actions`
                        }
                    }
                },
                scales: type === 'pie' ? undefined : {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: "Actions" }
                    },
                    y: {
                        title: { display: true, text: label }
                    }
                }
            }
        });
    } catch (error) {
        console.error(`Error creating ${canvasId} chart:`, error);
    }
}

// UI Helpers
function showLoadingIndicator(show) {
    if (elements.refreshButton && elements.loadingIndicator) {
        elements.refreshButton.disabled = show;
        elements.loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
    }
}

function clearError() {
    if (elements.errorMessage) {
        elements.errorMessage.style.display = 'none';
    }
}

function updateLastRefreshedTime() {
    if (elements.lastRefreshedTime) {
        elements.lastRefreshedTime.textContent = new Date().toLocaleTimeString();
    }
}

function redirectToDetails(user, page) {
    window.open(`user-page-details.html?user=${user}&page=${page}`, "_blank");
}

// Event Listeners
function setupEventListeners() {
    if (elements.refreshButton) {
        elements.refreshButton.addEventListener("click", fetchLatestData);
    }

    if (elements.sendInteractionsButton) {
        elements.sendInteractionsButton.addEventListener("click", async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/interactions/send-from-file`, {
                    method: "POST"
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                showNotification("Test data sent successfully");
            } catch (error) {
                console.error("Error sending test data:", error);
                showError("Failed to send test data");
            }
        });
    }

    if (elements.applyFilterButton) {
        elements.applyFilterButton.addEventListener("click", () => {
            currentPage = 1;
            applyCurrentFilters();
            updateUI();
        });
    }

    if (elements.resetFilterButton) {
        elements.resetFilterButton.addEventListener("click", () => {
            if (elements.userFilter) elements.userFilter.value = "";
            if (elements.actionFilter) elements.actionFilter.value = "";
            if (elements.roleFilter) elements.roleFilter.value = "";
            if (elements.pageFilter) elements.pageFilter.value = "";
            setDefaultDateRange();
            currentPage = 1;
            applyCurrentFilters();
            updateUI();
        });
    }

    if (elements.prevPage) {
        elements.prevPage.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
            }
        });
    }

    if (elements.nextPage) {
        elements.nextPage.addEventListener("click", () => {
            if (currentPage * rowsPerPage < filteredData.length) {
                currentPage++;
                updateTable();
            }
        });
    }
}

// Initialize the app
function initializeApp() {
    // Reset all state
    allData = [];
    filteredData = [];
    currentPage = 1;
    newDataAvailable = false;

    // Clear charts
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};

    // Initialize UI
    setupEventListeners();
    updateUI();
    updateRefreshButtonState();

    // Connect WebSocket
    connectWebSocket();

    // Load initial data
    fetchLatestData();
}

// Start when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

// Make functions available globally
window.redirectToDetails = redirectToDetails;
window.fetchLatestData = fetchLatestData;