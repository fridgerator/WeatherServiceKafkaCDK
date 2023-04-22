const { EventEmitter } = require("stream");
const { Kafka } = require("kafkajs");

const BOOTSTRAP_SERVERS =
  process.env.NODE_ENV === "prod"
    ? process.env.BOOTSTRAP_SERVERS
    : "localhost:29092,localhost:29093";
const DEBUG = process.env.NODE_ENV !== "prod";
const WEATHER_ALERTS_TOPIC = "weather_alerts";

const consumerEvents = new EventEmitter();

const kafka = new Kafka({
  clientId: "my-app",
  brokers: BOOTSTRAP_SERVERS.split(","),
  ssl: true,
});

const consumer = kafka.consumer({ groupId: "alert-dashboard" });

const startConsumer = async () => {
  await consumer.connect();
  console.log("Consumer connected: ", BOOTSTRAP_SERVERS);
  await consumer.subscribe({ topic: WEATHER_ALERTS_TOPIC });
  console.log("Subscribed to : ", WEATHER_ALERTS_TOPIC);
  await consumer.run({
    eachMessage: async ({ message }) => {
      const alert = JSON.parse(message.value.toString());

      try {
        const poly = alert["cap:polygon"]["#"]
          .split(" ")
          .map((y) => y.split(",").map((z) => parseFloat(z)));
        const emittedEvent = {
          poly,
          title: alert.title,
          description: alert.description,
          link: alert.link,
          expireCreate: new Date(),
        };
        consumerEvents.emit("alert", emittedEvent);
      } catch (e) {
        console.log("err : ", e);
      }
    },
  });
};

module.exports = {
  consumerEvents,
  startConsumer,
};
