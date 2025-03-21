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

        data.forEach((interaction, index) => {
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

        // Prepare Chart Data
        const roleCounts = {};
        const actionCounts = {};
        data.forEach(interaction => {
            roleCounts[interaction.userRole] = (roleCounts[interaction.userRole] || 0) + 1;
            actionCounts[interaction.actionType] = (actionCounts[interaction.actionType] || 0) + 1;
        });

        // Destroy old charts before rendering new ones
        if (window.roleChartInstance) window.roleChartInstance.destroy();
        if (window.actionChartInstance) window.actionChartInstance.destroy();

        // Bar Chart - User Roles
        window.roleChartInstance = new Chart(document.getElementById("roleChart"), {
            type: "bar",
            data: {
                labels: Object.keys(roleCounts),
                datasets: [{
                    label: "User Roles",
                    data: Object.values(roleCounts),
                    backgroundColor: "#007bff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Pie Chart - Action Types
        window.actionChartInstance = new Chart(document.getElementById("actionChart"), {
            type: "pie",
            data: {
                labels: Object.keys(actionCounts),
                datasets: [{
                    data: Object.values(actionCounts),
                    backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4caf50"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } catch (error) {
        console.error("Error loading interactions:", error);
        alert(`Failed to load interactions: ${error.message}`);
    }
}

// Ensure refresh and send interactions buttons are working
document.addEventListener("DOMContentLoaded", function () {
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
