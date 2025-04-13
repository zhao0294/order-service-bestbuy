# order-service

## Table of Contents

- [order-service](#order-service)
  - [Table of Contents](#table-of-contents)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Set Up Azure Service Bus and Environment Variables](#2-set-up-azure-service-bus-and-environment-variables)
    - [2.1 Create a Resource Group (Skip if already created)](#21-create-a-resource-group-skip-if-already-created)
    - [2.2 Create a Service Bus Namespace](#22-create-a-service-bus-namespace)
    - [2.3 Create a Queue](#23-create-a-queue)
    - [2.4 Configure Authentication (Recommended: Managed Identity)](#24-configure-authentication-recommended-managed-identity)
    - [2.5 Save Environment Variables to a `.env` File](#25-save-environment-variables-to-a-env-file)
  - [3. Load the environment variables](#3-load-the-environment-variables)
  - [4. Run the App Locally](#4-run-the-app-locally)
  - [5. Testing the API](#5-testing-the-api)
  - [6. Optional: Running with Docker Compose](#6-optional-running-with-docker-compose)

This is a Fastify application that provides a REST API for submitting orders. It is intended to be used together with the `store-front` app.

This API allows users to submit orders into a message queue that supports the AMQP 1.0 protocol, such as Azure Service Bus.

---

## 1. Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

This app connects to **Azure Service Bus** using the **AMQP 1.0** protocol. You will need to configure proper environment variables to establish the connection.

---

## 2. Set Up Azure Service Bus and Environment Variables

This guide walks you through creating an Azure Service Bus namespace and queue using the **Azure Portal**, retrieving necessary environment variables, and assigning appropriate permissions using **Microsoft Entra ID (formerly Azure AD)**.

### 2.1 Create a Resource Group (Skip if already created)

1. Go to [Azure Portal](https://portal.azure.com).
2. Search for **"Resource groups"** and open the service.
3. Click **+ Create**.
4. Fill in:
   - **Resource Group Name**: e.g., `CST8915FinalProject`
   - **Region**: e.g., `Canada Central`
5. Click **Review + Create** → **Create**

---

### 2.2 Create a Service Bus Namespace

1. Search for **"Service Bus"** in the Azure Portal and open the service.
2. Click **+ Create**.
3. Fill in the required fields:
   - **Subscription**
   - **Resource Group**: Select the one created above
   - **Namespace Name**: e.g., `bestbuynamespace`
   - **Region**
   - **Pricing Tier**: Choose **Standard** or **Premium**
4. Click **Review + Create** → **Create**

---

### 2.3 Create a Queue

1. Go to your **Service Bus Namespace**.
2. In the left menu, select **Queues**.
3. Click **+ Queue**.
4. Fill in:
   - **Queue Name**: e.g., `orders`
5. Click **Create**

---

### 2.4 Configure Authentication (Recommended: Managed Identity)

Use **Microsoft Entra Workload Identity** (formerly Managed Identity):

1. Go to your **Service Bus Namespace** → **Access Control (IAM)**
2. Click **+ Add** → **Add role assignment**
3. Select:
   - **Role**: `Azure Service Bus Data Sender`
   - **Assign access to**: *User, group, or service principal*
   - Select the user or managed identity running your app
4. Click **Save**

---

### 2.5 Save Environment Variables to a `.env` File

At the root of your project, create a `.env` file and add the following variables:

```env
ORDER_QUEUE_HOSTNAME="your-namespace.servicebus.windows.net"
ORDER_QUEUE_PORT=5671
ORDER_QUEUE_USERNAME=sender
ORDER_QUEUE_PASSWORD="your-primary-key"
ORDER_QUEUE_TRANSPORT=tls
ORDER_QUEUE_RECONNECT_LIMIT=10
ORDER_QUEUE_NAME=orders
```

  - ORDER_QUEUE_HOSTNAME: Found under Namespace Overview → Essentials → Host name
  - ORDER_QUEUE_PASSWORD: Get it from Shared access policies → sender → Primary key

⚠️ **Important**: Do not commit your `.env` file to version control. It contains sensitive credentials.

## 3. Load the environment variables

In your terminal, run:

```bash
source  .env
```

## 4. Run the App Locally

To install dependencies and start the app:

```bash
npm  install
npm  run  dev
```

Once the app is running, you should see output similar to:

```text
> order-service@1.0.0 dev
> fastify start -w -l info -P app.js
[1687920999327] INFO (108877 on yubuntu): Server listening at http://[::1]:3000
[1687920999327] INFO (108877 on yubuntu): Server listening at http://127.0.0.1:3000
```

## 5. Testing the API

You can test the API using the `test-order-service.http` file located at the root of the project.

To test it:

1. Open the project in **Visual Studio Code**  
2. Install the **REST Client** extension  
3. Open `test-order-service.http` and click **Send Request**

If everything is set up correctly, your order-service API should now be ready to receive and send messages to Azure Service Bus via AMQP 1.0.

## 6. Optional: Running with Docker Compose

If you prefer running the app in Docker, you can use the provided `docker-compose.yml`.

```bash
docker-compose up --build
```
