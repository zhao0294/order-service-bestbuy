require('dotenv').config();
const { ServiceBusClient } = require("@azure/service-bus");

async function main() {
  const connectionString = `Endpoint=sb://${process.env.ORDER_QUEUE_HOSTNAME}/;SharedAccessKeyName=${process.env.ORDER_QUEUE_USERNAME};SharedAccessKey=${process.env.ORDER_QUEUE_PASSWORD}`;
  const queueName = process.env.ORDER_QUEUE_NAME;

  const orderData = {
    id: "ORD123",
    product: "iPad",
    quantity: 2,
    timestamp: new Date().toISOString(),
  };

  console.log("📦 Message to be sent:", orderData);

  const sbClient = new ServiceBusClient(connectionString);
  const sender = sbClient.createSender(queueName);

  try {
    // Check if the connection is closed, and recreate it if necessary
    if (sender.isClosed) {
      console.log("Recreating the connection...");
      await sender.createSender(queueName);
    }

    // Send the message
    await sender.sendMessages({ body: orderData });
    console.log("✅ Message sent successfully");

  } catch (err) {
    console.error("❌ Message sending failed:", err);

  } finally {
    // Ensure that the sender and client are closed after all operations
    await sender.close();
    await sbClient.close();
    console.log("🔚 Sender and Client are closed");
  }
}

main().catch((err) => {
  console.error("🚨 Uncaught error in main process:", err);
});