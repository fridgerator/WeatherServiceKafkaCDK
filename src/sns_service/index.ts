import { KafkaConsumer } from "node-rdkafka";
import {
  SNSClient,
  CreateTopicCommand,
  CreateTopicCommandInput,
  PublishCommandInput,
  PublishCommand,
} from "@aws-sdk/client-sns";
import {
  BOOTSTRAP_SERVERS,
  DEBUG,
  getState,
  WEATHER_ALERTS_TOPIC,
} from "../utils";
import { Alert } from "../utils/alert";

const consumer = new KafkaConsumer(
  {
    "bootstrap.servers": BOOTSTRAP_SERVERS,
    "metadata.broker.list": BOOTSTRAP_SERVERS,
    "group.id": "states_subscription_service",
    "enable.auto.commit": false,
  },
  {}
);
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});
let topicsMap: { [key: string]: string } = {
  NE: "",
  TS: "",
  IL: "",
  MA: "",
  TN: "",
};

const sendSNSNotification = async (alert: Alert) => {
  const state = getState(alert);
  if (!topicsMap[state]) return;
  if (DEBUG) console.log("publish for state : ", state, topicsMap[state]);
  const input: PublishCommandInput = {
    TopicArn: topicsMap[state],
    Message: JSON.stringify(alert),
  };
  const command = new PublishCommand(input);
  await snsClient.send(command);
};

consumer.on("event.error", (err) => {
  console.log("err : ", err);
});

let counter = 0;
const numMessages = 5;

consumer.on("subscribed", (topics) => {
  if (DEBUG) console.log("subscribed, ", topics);
});

consumer.on("ready", () => {
  if (DEBUG) console.log("ready");
  consumer.subscribe([WEATHER_ALERTS_TOPIC]);
  consumer.consume();
  if (DEBUG) console.log("after consume");
});

consumer.on("data", (messageRaw) => {
  if (DEBUG) console.log("got data");
  counter++;

  if (counter % numMessages === 0) {
    consumer.commit(messageRaw);
  }

  if (messageRaw.value) {
    if (DEBUG)
      if (messageRaw.value)
        console.log("got : ", messageRaw.value.toString().length);

    const alert: Alert = JSON.parse(messageRaw.value.toString());
    sendSNSNotification(alert);
  }
});

consumer.on("disconnected", () => {
  console.log("consumer disconnected");
});

const setup = async () => {
  for (let state of Object.keys(topicsMap)) {
    const input: CreateTopicCommandInput = {
      Name: `STATE_${state}`,
    };
    const command = new CreateTopicCommand(input);
    const response = await snsClient.send(command);
    console.log("created topic : ", response);
    topicsMap[state] = response.TopicArn!;
  }
  consumer.connect();
};

setup();
