require('dotenv').config();
const { ServiceBusClient } = require("@azure/service-bus");

async function receiveMessages() {
  const connectionString = `Endpoint=sb://${process.env.ORDER_QUEUE_HOSTNAME}/;SharedAccessKeyName=${process.env.ORDER_QUEUE_USERNAME};SharedAccessKey=${process.env.ORDER_QUEUE_PASSWORD}`;
  const queueName = process.env.ORDER_QUEUE_NAME;

  const sbClient = new ServiceBusClient(connectionString);
  const receiver = sbClient.createReceiver(queueName);

  try {
    console.log("👂 Listening for messages...");

    // Receive messages
    const receivedMessage = await receiver.receiveMessages(1, { maxWaitTimeInMs: 5000 });

    if (receivedMessage.length > 0) {
      console.log("📬 Message received:", receivedMessage[0].body);
      // Complete the message after processing
      await receiver.completeMessage(receivedMessage[0]);
    } else {
      console.log("No messages received!");
    }
  } catch (err) {
    console.error("🚨 Failed to receive messages:", err);
  } finally {
    await receiver.close();
    await sbClient.close();
    console.log("🔚 Receiver and Client closed");
  }
}

receiveMessages().catch((err) => {
  console.error("🚨 Uncaught error in main process:", err);
});