# Kafka User Interaction Tracker

## Overview
The **Kafka User Interaction Tracker** is a Spring Boot application designed to **capture, process, and store user interactions** in real-time. The system leverages **Apache Kafka** for event-driven messaging, ensuring efficient and scalable handling of large volumes of interaction data. The application provides a **REST API** to send, retrieve, and analyze user interactions.

## Features
- **Real-time Tracking**: Captures user interactions such as clicks, form submissions, page visits, and more.
- **Event Streaming with Kafka**: Uses Apache Kafka as a message broker for **high-performance asynchronous processing**.
- **Scalable and Fault-Tolerant**: Kafka enables distributed and fault-tolerant messaging, ensuring reliability.
- **REST API**: Provides endpoints for sending and retrieving user interaction data.
- **Database Storage**: Uses **Spring Data JPA** to persist interaction data in a relational database.
- **Configurable Kafka Topics**: Supports custom Kafka topic configurations for event handling.
- **Logging & Monitoring**: Integrated with **Spring Boot Actuator** for monitoring system health and performance.
- **Exception Handling**: Includes robust error handling to manage failed message deliveries and API errors.

## Technologies Used
- **Java 21** – Core programming language.
- **Spring Boot** – Backend framework.
- **Spring Web** – For building REST APIs.
- **Spring Kafka** – Kafka integration for producer and consumer management.
- **Spring Data JPA** – For database interactions.
- **Apache Kafka** – Event streaming platform.
- **Gradle** – Build automation tool.
- **PostgreSQL/MySQL** – Relational database for storing interactions.
- **Docker** (Optional) – For containerized deployment.  
