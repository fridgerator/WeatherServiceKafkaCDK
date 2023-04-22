import * as path from "path";

import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
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

    // const mskArnParam = StringParameter.fromStringParameterName(
    //   this,
    //   "msk-arn-from-param",
    //   "/msk/cluster-arn"
    // );

    // const handlerRole = new Role(this, "weather-handler-role", {
    //   assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    // });
    // handlerRole.addToPolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ["kafka-cluster:*"],
    //     resources: [
    //       `arn:aws:kafka:${this.props.env?.region}:${this.props.env?.account}:*/msk-cluster/*`,
    //     ],
    //   })
    // );
    // handlerRole.addToPolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ["ec2:CreateNetworkInterface"],
    //     resources: ["*"],
    //   })
    // );

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
      // role: handlerRole,
    });

    new Rule(this, "weather-handler-timer", {
      targets: [new LambdaFunction(weatherHandlerLambda, {})],
      schedule: Schedule.rate(Duration.minutes(1)),
    });
  }
}
