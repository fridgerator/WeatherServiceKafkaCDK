// import { Producer } from "node-rdkafka";
import { getAlerts } from "./alerts";
import { Kafka } from "kafkajs";

import { Alert } from "../../../utils/alert";
import {
  BOOTSTRAP_SERVERS,
  DEBUG,
  WEATHER_ALERTS_TOPIC,
  getState,
} from "../../../utils/index";

const kafka = new Kafka({
  clientId: "weather_alerts",
  brokers: BOOTSTRAP_SERVERS.split(","),
  ssl: true,
});
const producer = kafka.producer({
  allowAutoTopicCreation: true,
});

const alertsCache: { [key: string]: Date } = {};

const produceAlerts = async () => {
  console.log("Getting alerts");
  let alerts: Alert[] = [];
  try {
    alerts = await getAlerts(DEBUG);
  } catch (e) {
    console.log("error getting alerts : ", e);
    return;
  }
  const newAlerts: Alert[] = [];

  alerts.forEach((alert) => {
    if (!alertsCache[alert.guid]) {
      newAlerts.push(alert);
    }
    alertsCache[alert.guid] = new Date();
  });

  console.log("new alerts : ", newAlerts.length);

  if (newAlerts.length > 100) {
    if (DEBUG) console.log("too many alerts, skipping");
  } else {
    await producer.send({
      topic: WEATHER_ALERTS_TOPIC,
      messages: newAlerts.map((alert) => ({
        key: getState(alert),
        value: JSON.stringify(alert),
      })),
    });
  }
};

export const weatherServiceHandler = async () => {
  console.log("Alerts cache size : ", Object.keys(alertsCache).length);

  await producer.connect();
  await produceAlerts();
};
