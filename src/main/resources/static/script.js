async function loadInteractions() {
    console.log("Fetching latest interactions...");

    try {
        const response = await fetch("http://localhost:9090/api/interactions");

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Data received:", data);

        // Update Table
        const tableBody = document.getElementById("tableBody");
        tableBody.innerHTML = "";

        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6">No interactions found.</td></tr>`;
            return;
        }

        let userSet = new Set();
        data.forEach((interaction, index) => {
            userSet.add(interaction.userName);

            let row = `<tr>
                <td>${index + 1}</td>
                <td>${interaction.userName || "N/A"}</td>
                <td>${interaction.userRole || "N/A"}</td>
                <td>${interaction.actionType || "N/A"}</td>
                <td>${interaction.pageName || "N/A"}</td>
                <td>${interaction.timestamp || "N/A"}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        // Update Statistics
        document.getElementById("totalActions").textContent = data.length;
        document.getElementById("totalUsers").textContent = userSet.size;
        document.getElementById("usersWithActions").textContent = userSet.size;
        document.getElementById("actionsPerUser").textContent = (data.length / userSet.size).toFixed(2);

        // Prepare Chart Data
        const actionCounts = {};
        data.forEach(interaction => {
            actionCounts[interaction.actionType] = (actionCounts[interaction.actionType] || 0) + 1;
        });

        // Destroy old chart before rendering new one
        if (window.actionChartInstance) window.actionChartInstance.destroy();

        // Bar Chart - Action Types
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

    } catch (error) {
        console.error("Error loading interactions:", error);
        alert(`Failed to load interactions: ${error.message}`);
    }
}

// Auto-refresh every 5 seconds without UI flicker
document.addEventListener("DOMContentLoaded", function () {
    loadInteractions();
    setInterval(loadInteractions, 5000);

    document.getElementById("refreshButton").addEventListener("click", loadInteractions);

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
});
