import {
  SNSClient,
  PublishCommandInput,
  PublishCommand,
} from "@aws-sdk/client-sns";
import { Kafka } from "kafkajs";

const WEATHER_ALERTS_TOPIC = "weather_alerts";

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const topicsMap: { [key: string]: string } = JSON.parse(
  process.env.TOPICS_MAP!
);

const getState = (alert: any): string => {
  return alert["cap:geocode"].value[1]["#"].split(" ")[0].substring(0, 2);
};

const go = async () => {
  const kafka = new Kafka({
    clientId: "lambda_sink",
    brokers: process.env.BOOTSTRAP_SERVERS!.split(","),
    ssl: true,
  });

  const consumer = kafka.consumer({ groupId: "lambda_sink" });

  await consumer.connect();
  console.log("Consumer connected: ", process.env.BOOTSTRAP_SERVERS);
  await consumer.subscribe({ topic: WEATHER_ALERTS_TOPIC });
  console.log("Subscribed to : ", WEATHER_ALERTS_TOPIC);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) console.warn("no message value");
      const alert = JSON.parse(message.value!.toString());
      const state = getState(alert);
      if (!topicsMap[state]) return;
      console.log("publish for state : ", state, topicsMap[state]);
      const input: PublishCommandInput = {
        TopicArn: topicsMap[state],
        Message: JSON.stringify(alert),
      };
      const command = new PublishCommand(input);
      await snsClient.send(command);
    },
  });
  console.log("Done");
};

go();
