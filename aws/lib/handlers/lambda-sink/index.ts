import {
  SNSClient,
  CreateTopicCommand,
  CreateTopicCommandInput,
  PublishCommandInput,
  PublishCommand,
  PublishBatchCommand,
} from "@aws-sdk/client-sns";

import { getState } from "../../../utils/index";
import { Alert } from "../../../utils/alert";

export interface Payload {
  key: string;
  keySchemaName: any;
  keySchemaVersion: any;
  value: any;
  valueSchemaName: string;
  valueSchemaVersion: string;
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  timestampTypeName: string;
}

// export interface SinkParams {
//   payload: Payload;
// }

// export interface Payload {
//   topic: string;
//   partition: number;
//   offset: number;
//   key: string;
//   value: string;
//   headers: {
//     key: string;
//     value: string;
//   }[];
//   timestamp: number;
// }

// export interface Header {
//   key: string
//   value: string
// }

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const topicsMap: { [key: string]: string } = JSON.parse(
  process.env.TOPICS_MAP!
);

export const lambdaSinkHandler = async (params: Payload[]) => {
  console.log("topicsMap : ", topicsMap);
  for (let param of params) {
    // const alert: Alert = JSON.parse(param.payload.value);
    const alert: Alert = param.value;
    const state = getState(alert);
    if (!topicsMap[state]) return;
    console.log("publish for state : ", state, topicsMap[state]);
    const input: PublishCommandInput = {
      TopicArn: topicsMap[state],
      Message: JSON.stringify(alert),
    };
    const command = new PublishCommand(input);
    await snsClient.send(command);
  }
};
