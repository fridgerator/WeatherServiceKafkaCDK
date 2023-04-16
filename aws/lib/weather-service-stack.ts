import * as path from "path";

import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";

export class WeatherServiceStack extends Stack {
  props: StackProps;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    this.props = props;
    this.build();
  }

  build() {
    // const boostrapParam = StringParameter.fromStringParameterName(
    //   this,
    //   "msk-brokers-from-param",
    //   "/msk/bootstrap-brokers"
    // );

    const weatherHandlerLambda = new NodejsFunction(this, "weather-handler", {
      functionName: "weather-handler",
      entry: path.join(__dirname, "handlers", "weather-handler/index.ts"),
      handler: "weatherServiceHandler",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        // BOOTSTRAP_SERVERS: boostrapParam.stringValue,
        BOOTSTRAP_SERVERS: "",
        NODE_ENV: "prod",
      },
    });

    new Rule(this, "weather-handler-timer", {
      targets: [new LambdaFunction(weatherHandlerLambda, {})],
      schedule: Schedule.rate(Duration.minutes(1)),
    });
  }
}
