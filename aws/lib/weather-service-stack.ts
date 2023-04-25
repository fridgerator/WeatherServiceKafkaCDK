import * as path from "path";

import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

export class WeatherServiceStack extends Stack {
  props: StackProps;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    this.props = props;
    this.build();
  }

  build() {
    const boostrapParam = StringParameter.fromStringParameterName(
      this,
      "msk-brokers-from-param",
      "/msk/bootstrap-brokers"
    );

    const vpc = Vpc.fromLookup(this, "msk-vpc-lookup", {
      vpcName: "msk-vpc",
    });

    const weatherHandlerLambda = new NodejsFunction(this, "weather-handler", {
      functionName: "weather-handler",
      entry: path.join(__dirname, "handlers", "weather-handler/index.js"),
      handler: "weatherServiceHandler",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        BOOTSTRAP_SERVERS: boostrapParam.stringValue,
        NODE_ENV: "prod",
      },
      timeout: Duration.minutes(1),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    new Rule(this, "weather-handler-timer", {
      targets: [new LambdaFunction(weatherHandlerLambda, {})],
      schedule: Schedule.rate(Duration.minutes(1)),
    });
  }
}
