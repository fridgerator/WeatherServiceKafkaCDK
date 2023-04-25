#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MskStack } from "../lib/msk-stack";
import { WeatherServiceStack } from "../lib/weather-service-stack";
import { DashboardStack } from "../lib/dashboard-stack";
import { LambdaConnectStack } from "../lib/lambda-connect-stack";
import { FargateClusterStack } from "../lib/fargate-cluster-stack";

const app = new cdk.App();

const props = {
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT,
  },
};

new MskStack(app, "MskStack", props);
new FargateClusterStack(app, "FargateClusterStack", props);
new WeatherServiceStack(app, "WeatherServiceStack", props);
new LambdaConnectStack(app, "LambdaConnectStack", props);
new DashboardStack(app, "DashboardStack", props);
