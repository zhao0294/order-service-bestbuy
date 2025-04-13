# Table of Contents

1. [Prerequisites](#prerequisites)
  
2. [Get Environment Variables to Connect to Azure Service Bus](#get-environment-variables-to-connect-to-azure-service-bus)
  

    - [Option 1: Using Azure CLI](#option-1-using-azure-cli)

    - [Option 2: Using Azure Portal](#option-2-using-azure-portal)

3. [Running the App Locally](#running-the-app-locally)
  
4. [Testing the API](#testing-the-api)
  
5. [Summary of Required Environment Variables](#summary-of-required-environment-variables)
  

# order-service

This is a Fastify app that provides an API for submitting orders. It is meant to be used in conjunction with the store-front app.

It is a simple REST API that allows you to add an order to a message queue that supports the AMQP 1.0 protocol.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)
  
- [Docker](https://docs.docker.com/get-docker/)
  
- [Docker Compose](https://docs.docker.com/compose/install/)
  

This app connect to Azure Service Bus using AMQP 1.0, and you will need to provide appropriate environment variables for connecting to the message queue.

## Get environment variables to connect to Azure Service Bus

### option 1: Using Azure CLI

#### 🛠️ Step 1: Create a Resource Group

To begin, create a resource group using the Azure CLI:

``````bash
az group create --name <resource-group-name> --location <location>
```

#### **🛠️Step 2: Create a Service Bus Namespace**

Next, create a Service Bus namespace within the resource group:

```bash
az servicebus namespace create --name <namespace-name> --resource-group <resource-group-name>
```

#### **Step 3: Create a Queue**

Create a queue named orders in the Service Bus namespace:

```bash
az servicebus queue create --name orders --namespace-name <namespace-name> --resource-group <resource-group-name>
```

#### **Step 4: Choose an Authentication Method**

You have two options for authentication: Shared Access Policy or Microsoft Entra Workload Identity (passwordless authentication).

##### **Option A: Shared Access Policy (Connection String)**

1. Create a shared access policy with **Send** permission using Azure CLI:
  
  ```bash
  az servicebus queue authorization-rule create --name sender --namespace-name <namespace-name> --resource-group <resource-group-name> --queue-name orders --rights Send
  ```
  

2. Retrieve the **Primary Connection String** and **Primary Key** from the Azure Portal.
  
3. Set these values as environment variables:
  

```
SERVICEBUS_CONNECTION_STRING=<your-connection-string>
```

##### **Option B: Microsoft Entra Workload Identity (Recommended)**

If you prefer a passwordless experience, use Managed Identity.

1. Retrieve the objectId of the signed-in user:
  
  ```bash
  PRINCIPALID=$(az ad signed-in-user show --query objectId -o tsv)
  ```
  

2. Retrieve the id of the Service Bus namespace:
  
  ```bash
  SERVICEBUSBID=$(az servicebus namespace show --name <namespace-name> --resource-group <resource-group-name> --query id -o tsv)
  ```
  

3. Assign the Azure Service Bus Data Sender role to your managed identity:
  
  ```bash
  az role assignment create --role "Azure Service Bus Data Sender" --assignee $PRINCIPALID --scope $SERVICEBUSBID
  ```
  

#### **Step 5: Retrieve Hostname for the Queue**

Retrieve the hostname for the Azure Service Bus queue:

```bash
HOSTNAME=$(az servicebus namespace show --name <namespace-name> --resource-group <resource-group-name> --query serviceBusEndpoint -o tsv | sed 's/https:\/\///;s/:443\///')
```

#### **Step 6: Save Environment Variables to a **.env** **File**

Save the necessary environment variables to a .env file:

```bash
cat << EOF > .env
USE_WORKLOAD_IDENTITY_AUTH=true
AZURE_SERVICEBUS_FULLYQUALIFIEDNAMESPACE=$HOSTNAME
ORDER_QUEUE_NAME=orders
EOF
```

### option 2 # Using Azure Portal

This guide walks you through setting up an Azure Service Bus namespace and a queue using the **Azure Portal**, and how to retrieve necessary environment variables and assign proper roles for authentication using **Microsoft Entra ID (formerly Azure AD)**.

#### Step 1: Create a Resource Group

1. Go to [https://portal.azure.com](https://portal.azure.com)
  
2. In the search bar, type **"Resource groups"** and open the service.
  
3. Click **+ Create**.
  
4. Enter:
  

- **Resource Group Name** (e.g., `my-resource-group`)
  
- **Region** (e.g., `East US`)
  

5. Click **Review + Create** → **Create**

#### Step 2: Create a Service Bus Namespace

1. In the Portal search bar, type **"Service Bus"** and open the service.
  
2. Click **+ Create**.
  
3. Fill in:
  

- **Subscription**
  
- **Resource Group**: Select the one you created earlier
  
- **Namespace Name**: e.g., `myservicebusns`
  
- **Region**
  
- **Pricing Tier**: Choose **Standard** or **Premium**
  

4. Click **Review + Create** → **Create**

#### Step 3: Create a Queue

1. Go to your **Service Bus Namespace** resource.
  
2. In the left navigation menu, click **Queues**.
  
3. Click **+ Queue**.
  
4. Enter:
  

- **Queue Name**: e.g., `orders`
  

5. Click **Create**

#### Step 4: Choose an Authentication Method

You have two options:

##### Option A: Shared Access Policy (Connection String)

1. Go to the **Service Bus Namespace** → **Shared access policies**
  
2. Click on `RootManageSharedAccessKey` (or create your own policy)
  
3. Copy the **Primary Connection String** and **Primary Key**
  
4. Save these values in your environment variables:
  

```env
SERVICEBUS_CONNECTION_STRING=<your-connection-string>
```

##### Option B (Recommended): Microsoft Entra Workload Identity (Managed Identity)

1. Go to the **Service Bus Namespace** → **Access Control (IAM)**
  
2. Click **+ Add** → **Add role assignment**
  
3. In the **Role** dropdown, select:
  

- `Azure Service Bus Data Sender`
  

4. In **Assign access to**, choose **User, group, or service principal**
  
5. Search and select the user or managed identity running your application
  
6. Click **Save**
  

#### Step 5: Retrieve Hostname for the Queue

1. Go to your **Service Bus Namespace**
  
2. In the **Overview** tab, find the **Service Bus Endpoint**, which looks like:
  

```textile
https://<namespace-name>.servicebus.windows.net:443/
```

3. Extract the hostname by removing `https://` and the port number `:443/`, resulting in:

`<namespace-name>.servicebus.windows.net`

1. Save this value in your environment variables:

```env
SERVICEBUS_HOSTNAME=<namespace-name>.servicebus.windows.net
```

If you choose to use a shared access policy, you can create one using the Azure CLI. Otherwise, you can skip this step and proceed to [running the app locally](#running-the-app-locally).

```bash
az servicebus queue authorization-rule create --name sender --namespace-name <namespace-name> --resource-group <resource-group-name> --queue-name orders --rights Send
```

Next, get the connection information for the Azure Service Bus queue.

```bash
HOSTNAME=$(az servicebus namespace show --name <namespace-name> --resource-group <resource-group-name> --query serviceBusEndpoint -o tsv | sed 's/https:\/\///;s/:443\///')
PASSWORD=$(az servicebus queue authorization-rule keys list --namespace-name <namespace-name> --resource-group <resource-group-name> --queue-name orders --name sender --query primaryKey -o tsv)
```

#### **Step 6: Save Environment Variables to a **.env** **File

Save the necessary environment variables to a .env file:

```bash
cat << EOF > .env
ORDER_QUEUE_HOSTNAME=$HOSTNAME
ORDER_QUEUE_PORT=5671
ORDER_QUEUE_USERNAME=sender
ORDER_QUEUE_PASSWORD="$PASSWORD"
ORDER_QUEUE_TRANSPORT=tls
ORDER_QUEUE_RECONNECT_LIMIT=10
ORDER_QUEUE_NAME=orders
EOF
```

## load the environment variables

To load the environment variables, run the following:

```bash
source .env
```

## Running the app locally

To run the app, run the following command:

```bash
npm install
npm run dev
```

When the app is running, you should see output similar to the following:

```text
> order-service@1.0.0 dev
> fastify start -w -l info -P app.js
[1687920999327] INFO (108877 on yubuntu): Server listening at http://[::1]:3000
[1687920999327] INFO (108877 on yubuntu): Server listening at http://127.0.0.1:3000
```

## Testing the API

Using the [`test-order-service.http`](./test-order-service.http) file in the root of the repo, you can test the API. However, you will need to use VS Code and have the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension installed.

To view the order messages in RabbitMQ, open a browser and navigate to [http://localhost:15672](http://localhost:15672). Log in with the username and password you provided in the environment variables above. Then click on the **Queues** tab and click on your **orders** queue. After you've submitted a few orders, you should see the messages in the queue.

## Summary of Required Environment Variables

### 1. **Authentication**

| **Variable Name**              | **Description**                                                           | **Value Example**                         |
| ------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------- |
| `USE_WORKLOAD_IDENTITY_AUTH`   | Set to `true` to use Microsoft Entra Workload Identity for authentication | `true`                                    |
| `SERVICEBUS_CONNECTION_STRING` | Connection string for Service Bus if using Shared Access Policy           | `<your-connection-string>`                |
| `ORDER_QUEUE_USERNAME`         | Username for connecting to the queue                                      | `sender`                                  |
| `ORDER_QUEUE_PASSWORD`         | Password for queue connection                                             | `<your-primary-key>`                      |
| `ORDER_QUEUE_HOSTNAME`         | Hostname of the Service Bus queue                                         | `<namespace-name>.servicebus.windows.net` |
| `ORDER_QUEUE_TRANSPORT`        | Protocol for queue connection                                             | `tls`                                     |
| `ORDER_QUEUE_RECONNECT_LIMIT`  | Limit of reconnections                                                    | `10`                                      |

### 2. **Queue Settings**

| **Variable Name**                          | **Description**                           | **Value Example** |
| ------------------------------------------ | ----------------------------------------- | ----------------- |
| `AZURE_SERVICEBUS_FULLYQUALIFIEDNAMESPACE` | Fully qualified namespace for Service Bus | `<hostname>`      |
| `ORDER_QUEUE_NAME`                         | The name of the queue                     | `orders`          |
| `ORDER_QUEUE_PORT`                         | Port for connecting to the queue          | `5671`            |

### 3. **Environment Configuration**

| **Variable Name**            | **Description**                          | **Value Example** |
| ---------------------------- | ---------------------------------------- | ----------------- |
| `USE_WORKLOAD_IDENTITY_AUTH` | Set to `true` for workload identity auth | `true`            |

### 4. **Optional Variables for Shared Access Policy Authentication**

| **Variable Name**              | **Description**                                                             | **Value Example**                         |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------------------------------- |
| `SERVICEBUS_CONNECTION_STRING` | The connection string for the Service Bus (when using Shared Access Policy) | `<your-connection-string>`                |
| `ORDER_QUEUE_USERNAME`         | Username for connecting to the queue                                        | `sender`                                  |
| `ORDER_QUEUE_PASSWORD`         | Password for the queue connection                                           | `<your-primary-key>`                      |
| `ORDER_QUEUE_HOSTNAME`         | Hostname for the queue                                                      | `<namespace-name>.servicebus.windows.net` |
| `ORDER_QUEUE_TRANSPORT`        | Transport protocol for queue connection                                     | `tls`                                     |
| `ORDER_QUEUE_RECONNECT_LIMIT`  | Maximum number of reconnections allowed                                     | `10`                                      |