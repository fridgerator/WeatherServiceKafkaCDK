const { EventEmitter } = require("stream");
// const { KafkaConsumer } = require("node-rdkafka");

const BOOTSTRAP_SERVERS =
  process.env.NODE_ENV === "prod"
    ? process.env.BOOTSTRAP_SERVERS
    : "localhost:29092,localhost:29093";
const DEBUG = process.env.NODE_ENV !== "prod";
const WEATHER_ALERTS_TOPIC = "weather_alerts";

// const consumer = new KafkaConsumer(
//   {
//     "bootstrap.servers": BOOTSTRAP_SERVERS,
//     "metadata.broker.list": BOOTSTRAP_SERVERS,
//     "group.id": "alerts_dashboard",
//     "enable.auto.commit": false,
//   },
//   {}
// );
const events = new EventEmitter();
let counter = 0;
const numMessages = 5;

// consumer.on("event.error", (err) => {
//   console.log("err : ", err);
// });

// consumer.on("subscribed", (topics) => {
//   if (DEBUG) console.log("subscribed, ", topics);
// });

// consumer.on("ready", () => {
//   if (DEBUG) console.log("ready");
//   consumer.subscribe([WEATHER_ALERTS_TOPIC]);
//   consumer.consume();
//   if (DEBUG) console.log("after consume");
// });

// consumer.on("data", (messageRaw) => {
//   if (DEBUG) console.log("got data");
//   counter++;

//   if (counter % numMessages === 0) {
//     consumer.commit(messageRaw);
//   }

//   if (messageRaw.value) {
//     if (DEBUG)
//       if (messageRaw.value)
//         console.log("got : ", messageRaw.value.toString().length);

//     const alert = JSON.parse(messageRaw.value.toString());
//     try {
//       const poly = alert["cap:polygon"]["#"]
//         .split(" ")
//         .map((y) => y.split(",").map((z) => parseFloat(z)));
//       const emittedEvent = {
//         poly,
//         title: alert.title,
//         description: alert.description,
//         link: alert.link,
//         expireCreate: new Date(),
//       };
//       events.emit("alert", emittedEvent);
//     } catch (e) {
//       console.log("err : ", e);
//       console.log(alert.title);
//     }
//   }
// });

// consumer.on("disconnected", () => {
//   console.log("consumer disconnected");
// });

// consumer.connect();

module.exports = {
  events,
};
