require('dotenv').config();
const { ServiceBusClient } = require("@azure/service-bus");

async function receiveMessages() {
  const connectionString = `Endpoint=sb://${process.env.ORDER_QUEUE_HOSTNAME}/;SharedAccessKeyName=${process.env.ORDER_QUEUE_USERNAME};SharedAccessKey=${process.env.ORDER_QUEUE_PASSWORD}`;
  const queueName = process.env.ORDER_QUEUE_NAME;

  const sbClient = new ServiceBusClient(connectionString);
  const receiver = sbClient.createReceiver(queueName);

  try {
    console.log("👂 正在接收消息...");

    // 接收一条消息
    const receivedMessage = await receiver.receiveMessages(1, { maxWaitTimeInMs: 5000 });

    if (receivedMessage.length > 0) {
      console.log("📬 接收到的消息：", receivedMessage[0].body);
      // 处理完消息后，完成它
      await receiver.completeMessage(receivedMessage[0]);
    } else {
      console.log("没有接收到消息！");
    }
  } catch (err) {
    console.error("🚨 消息接收失败：", err);
  } finally {
    await receiver.close();
    await sbClient.close();
    console.log("🔚 Receiver 和 Client 已关闭");
  }
}

receiveMessages().catch((err) => {
  console.error("🚨 未捕获的主流程错误：", err);
});