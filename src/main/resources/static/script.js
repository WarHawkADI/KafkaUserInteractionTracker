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
    // Handle both ISO format and "yyyy-MM-dd HH:mm:ss" format
    const datePart = dateString.includes('T')
        ? dateString.split('T')[0]
        : dateString.split(' ')[0];
    return datePart || "Unknown";
}

function normalizeInteraction(interaction) {
    return {
        ...interaction,
        userName: interaction.userName || "Unknown",
        userRole: interaction.userRole || "Unknown",
        actionType: interaction.actionType || "Unknown",
        pageName: interaction.pageName || "Unknown",
        formattedCreatedAt: formatDate(interaction.createdAt),
        datePart: extractDatePart(interaction.createdAt)
    };
}

// WebSocket Functions
function initWebSocket() {
    socket = new SockJS('http://localhost:9090/ws-interactions');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, function(frame) {
        console.log('WebSocket connected:', frame);
        isConnected = true;
        updateConnectionStatus('🟢 Connected');
        clearReconnectAttempts();

        stompClient.subscribe('/topic/interactions', function(message) {
            try {
                const newData = JSON.parse(message.body);
                if (!Array.isArray(newData)) {
                    throw new Error('Received data is not an array');
                }
                handleNewData(newData);
            } catch (e) {
                console.error('Error processing WebSocket message:', e);
            }
        });
    }, function(error) {
        console.error('WebSocket error:', error);
        isConnected = false;
        updateConnectionStatus('🔴 Disconnected');
        handleReconnect();
    });
}

function handleReconnect() {
    if (!reconnectInterval && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = Math.min(1000 * reconnectAttempts, 10000);
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
    const statusElement = document.getElementById('connectionStatus') ||
        document.createElement('div');

    statusElement.id = 'connectionStatus';
    statusElement.style.position = 'fixed';
    statusElement.style.bottom = '10px';
    statusElement.style.right = '10px';
    statusElement.style.padding = '5px 10px';
    statusElement.style.backgroundColor = status.includes('🟢') ? '#4CAF50' : '#F44336';
    statusElement.style.color = 'white';
    statusElement.style.borderRadius = '5px';
    statusElement.style.zIndex = '1000';
    statusElement.textContent = status;

    if (!document.getElementById('connectionStatus')) {
        document.body.appendChild(statusElement);
    }
}

// Data Loading
async function loadInteractions() {
    if (!isConnected) {
        apiHitCount++;
        try {
            console.log('Attempting to load interactions via API');
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

function handleNewData(newData) {
    // Normalize all incoming data
    allData = newData.map(normalizeInteraction);

    // Save current filter values
    const currentFilters = {
        user: document.getElementById("userFilter")?.value || "",
        action: document.getElementById("actionFilter")?.value || "",
        role: document.getElementById("roleFilter")?.value || "",
        page: document.getElementById("pageFilter")?.value || ""
    };

    applyFilters(currentFilters);
    updateUI();
}

// Filter Functions
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

        // Save current selection
        const currentValue = element.value;

        // Reset options
        element.innerHTML = `<option value="">All ${filter.label}</option>`;

        // Get unique values
        const uniqueValues = [...new Set(allData.map(item => item[filter.key]))]
            .filter(Boolean)
            .sort();

        // Add options
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

function applyFilter() {
    const currentFilters = {
        user: document.getElementById("userFilter")?.value || "",
        action: document.getElementById("actionFilter")?.value || "",
        role: document.getElementById("roleFilter")?.value || "",
        page: document.getElementById("pageFilter")?.value || ""
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

function redirectToDetails(user, page) {
    window.open(`user-page-details.html?user=${user}&page=${page}`, "_blank");
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
    // Calculate action counts per user
    const userActionCounts = {};
    filteredData.forEach(interaction => {
        const user = interaction.userName;
        userActionCounts[user] = (userActionCounts[user] || 0) + 1;
    });

    // Add actionCount to each interaction
    filteredData = filteredData.map(interaction => ({
        ...interaction,
        actionCount: userActionCounts[interaction.userName] || 0
    }));

    const totalActions = filteredData.length;
    const userSet = new Set(filteredData.map(interaction => interaction.userName));
    const gini = calculateGiniCoefficient(filteredData);
    const giniPercentage = (gini * 100).toFixed(2);

    // Update DOM elements
    const setTextContent = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setTextContent("totalActions", totalActions);
    setTextContent("totalUsers", userSet.size);
    setTextContent("usersWithActions", userSet.size);
    setTextContent("actionsPerUser", userSet.size ? (totalActions / userSet.size).toFixed(2) : 0);
    setTextContent("giniPercentage", `${giniPercentage}%`);
    setTextContent("apiHitCount", apiHitCount);
}

// Chart Functions
function updateCharts() {
    updateChart('actionChart', 'bar', 'Actions Performed', "#007bff", 'actionType');
    updateDailyActionChart();
    updateRankingChart('pageRankingChart', 'pageName', 'Page');
    updateRankingChart('rolePieChart', 'userRole', 'Role', 'pie');
}

function updateChart(canvasId, type, label, color, property) {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return;
        }

        // Filter out interactions without the property
        const validData = filteredData.filter(i => i[property]);
        if (validData.length === 0) return;

        // Count occurrences
        const counts = {};
        validData.forEach(interaction => {
            const key = interaction[property];
            counts[key] = (counts[key] || 0) + 1;
        });

        // Destroy previous chart if exists
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        // Create new chart
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

        // Count actions per date
        const dateCounts = {};
        filteredData.forEach(interaction => {
            const date = interaction.datePart;
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        });

        // Sort by date
        const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
        const sortedCounts = sortedDates.map(date => dateCounts[date]);

        // Destroy previous chart
        if (chartInstances['dailyActionChart']) {
            chartInstances['dailyActionChart'].destroy();
        }

        // Create new chart
        const ctx = canvas.getContext('2d');
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
                        title: { display: true, text: 'Date' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Actions' }
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

        // Count occurrences
        const counts = {};
        filteredData.forEach(interaction => {
            const key = interaction[property] || `Unknown ${label}`;
            counts[key] = (counts[key] || 0) + 1;
        });

        // Sort and get top items
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topItems = type === 'pie' ? sorted : sorted.slice(0, 5);

        // Destroy previous chart
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }

        // Create new chart
        const ctx = canvas.getContext('2d');
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
                        title: { display: true, text: "Number of Actions" }
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

// UI Update Function
function updateUI() {
    populateFilterOptions();
    updateTable();
    updateStats();
    updateCharts();
}

// Event Listeners
function setupEventListeners() {
    // Pagination
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

    // Buttons
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

    // Initial UI update
    updateUI();
}

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

// Make redirect function available globally
window.redirectToDetails = redirectToDetails;