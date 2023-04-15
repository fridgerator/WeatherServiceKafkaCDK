import { Producer } from "node-rdkafka";
import { getAlerts } from "./alerts";
import { Alert } from "../utils/alert";

import {
  BOOTSTRAP_SERVERS,
  DEBUG,
  WEATHER_ALERTS_TOPIC,
  getState,
} from "../utils";

const producer = new Producer({
  "bootstrap.servers": BOOTSTRAP_SERVERS,
  dr_msg_cb: true,
});

const alertsCache: { [key: string]: Date } = {};

const produceAlerts = async () => {
  if (DEBUG) console.log("producing alerts");
  let alerts: Alert[] = [];
  try {
    alerts = await getAlerts(DEBUG);
  } catch (e) {
    console.log("hmmm : ", e);
    return;
  }
  const newAlerts: Alert[] = [];

  alerts.forEach((alert) => {
    if (!alertsCache[alert.guid]) {
      newAlerts.push(alert);
    }
    alertsCache[alert.guid] = new Date();
  });

  if (DEBUG) console.log("new alerts : ", newAlerts.length);

  if (newAlerts.length > 100) {
    if (DEBUG) console.log("too many alerts, skipping");
  } else {
    newAlerts.forEach((alert) => {
      const state = getState(alert);
      producer.produce(
        WEATHER_ALERTS_TOPIC,
        -1,
        Buffer.from(JSON.stringify(alert)),
        state
      );
    });

    producer.flush(10000, () => {
      if (DEBUG) console.log("flushed data");
    });
  }

  setTimeout(() => {
    produceAlerts();
  }, 60 * 1000);
};

producer
  .on("ready", () => {
    console.log("Producer ready");
    produceAlerts();
  })
  .on("delivery-report", (err, report) => {
    if (err) {
      console.warn("error producing: ", err);
    } else {
      const { topic, key, value } = report;
      let k = key?.toString().padEnd(10, " ");
      if (DEBUG)
        console.log(
          `Produced event to topic ${topic}: key = ${k} value = ${
            value!.length
          }`
        );
    }
  })
  .on("event.error", (err) => {
    console.log("event.error : ", err);
  });

producer.connect();
