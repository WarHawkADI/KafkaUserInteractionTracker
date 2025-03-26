# Kafka User Interaction Tracker

## Overview
The **Kafka User Interaction Tracker** is a Spring Boot application designed to capture, process, and store user interactions in real-time. The system leverages Apache Kafka for event-driven messaging, ensuring efficient and scalable handling of large volumes of interaction data. The application provides a REST API to send, retrieve, and analyze user interactions, along with a **real-time dashboard** for visualizing interaction metrics.

---

## Features
1. **Real-time Tracking**:
    - Captures user interactions such as clicks, form submissions, page visits, and more.
    - Tracks user roles (e.g., Admin, User, Guest) and actions across different pages.

2. **Event Streaming with Kafka**:
    - Uses Apache Kafka as a message broker for high-performance asynchronous processing.
    - Supports custom Kafka topic configurations for event handling.

3. **Scalable and Fault-Tolerant**:
    - Kafka enables distributed and fault-tolerant messaging, ensuring reliability.

4. **REST API**:
    - Provides endpoints for sending and retrieving user interaction data.
    - Supports filtering interactions by user, role, action, and page.

5. **Database Storage**:
    - Uses Spring Data JPA to persist interaction data in a relational database (PostgreSQL/MySQL).

6. **Real-time Dashboard**:
    - A web-based dashboard built with **HTML, CSS, and JavaScript** for visualizing interaction metrics.
    - Features:
        - **Animated Statistics**: Total actions, total users, actions per user, Gini coefficient for activity distribution, and API hit count.
        - **Interactive Charts**:
            - Bar chart for actions performed.
            - Line chart for daily actions.
            - Horizontal bar chart for page ranking.
            - Pie chart for user role distribution.
        - **Filtering**: Filter interactions by user, role, action, and page.
        - **Pagination**: Navigate through interaction data with pagination.

7. **Logging & Monitoring**:
    - Integrated with Spring Boot Actuator for monitoring system health and performance.

8. **Exception Handling**:
    - Includes robust error handling to manage failed message deliveries and API errors.

---

## Technologies Used
- **Java 21**: Core programming language.
- **Spring Boot**: Backend framework.
- **Spring Web**: For building REST APIs.
- **Spring Kafka**: Kafka integration for producer and consumer management.
- **Spring Data JPA**: For database interactions.
- **Apache Kafka**: Event streaming platform.
- **Gradle**: Build automation tool.
- **PostgreSQL/MySQL**: Relational database for storing interactions.
- **HTML/CSS/JavaScript**: For the real-time dashboard.
- **Chart.js**: For visualizing interaction data in the dashboard.
- **Docker (Optional)**: For containerized deployment.

---

## Dashboard Features
The **real-time dashboard** provides a comprehensive view of user interactions with the following features:

### 1. **Animated Statistics**
- **Total Actions**: Total number of interactions captured.
- **Total Users**: Number of unique users.
- **Users with Actions**: Number of users who performed actions.
- **Actions per User**: Average actions per user.
- **Activity Distribution (Gini Coefficient)**: Measures the inequality in user activity.
- **API Hits**: Number of API requests made to the backend.

### 2. **Interactive Charts**
- **Bar Chart**: Displays the number of actions performed by type.
- **Line Chart**: Shows daily interaction trends.
- **Horizontal Bar Chart**: Ranks pages by the number of interactions.
- **Pie Chart**: Visualizes the distribution of users by role (Admin, User, Guest).

### 3. **Filters**
- Filter interactions by:
    - **User**: Select a specific user.
    - **Role**: Filter by user role (Admin, User, Guest).
    - **Action**: Filter by action type (e.g., click, form submission).
    - **Page**: Filter by page name.

### 4. **Pagination**
- Navigate through interaction data with **Previous** and **Next** buttons.

### 5. **Real-time Updates**
- The dashboard auto-refreshes every 5 seconds to display the latest interaction data.

---

## API Endpoints
### 1. **Send Interactions**
- Sends user interaction data to Kafka for processing.

### 2. **Retrieve Interactions**
- Retrieves all interactions from the database.
- Supports filtering by user, role, action, and page.

### 3. **Send Interactions from File**
- Sends a batch of interactions from a file to Kafka for processing.

---

## Getting Started
### Prerequisites
- Java 21
- Apache Kafka
- PostgreSQL/MySQL
- Gradle

### Installation
1. Clone the repository.
2. Configure the application by updating the `application.properties` file.
3. Build the project using Gradle.
4. Run the application.
5. Access the dashboard by opening `index.html` in your browser.
 6.  .\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties
  7. .\bin\windows\kafka-server-start.bat .\config\server.properties


---

## Docker Deployment (Optional)
1. Build the Docker image.
2. Run the Docker container.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contributing
Contributions are welcome! Please open an issue or submit a pull request.