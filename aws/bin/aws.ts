#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MskStack } from "../lib/msk-stack";
import { WeatherServiceStack } from "../lib/weather-service-stack";
import { DashboardStack } from "../lib/dashboard-stack";
import { LambdaConnectStack } from "../lib/lambda-connect-stack";

const app = new cdk.App();
new MskStack(app, "MskStack", {
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT,
  },
});

new WeatherServiceStack(app, "WeatherServiceStack", {
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT,
  },
});

new LambdaConnectStack(app, "LambdaConnectStack", {
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT,
  },
});

new DashboardStack(app, "DashboardStack", {
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT,
  },
});
