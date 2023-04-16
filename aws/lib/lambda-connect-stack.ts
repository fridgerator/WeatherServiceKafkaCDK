import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { CfnConnector, CfnConnectorProps } from "aws-cdk-lib/aws-kafkaconnect";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

const PLUGIN_BUCKET = "msk-connect-plugin-bucket";
const PLUGIN_FILE = "confluentinc-kafka-connect-aws-lambda-2.0.6";

export class MskConnectStack extends Stack {
  props: StackProps;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    this.props = props;
    this.build();
  }

  build() {
    const plugin = new AwsCustomResource(this, "msk-connect-plugin", {
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:GetObject"],
          resources: [`arn:aws:s3:::${PLUGIN_BUCKET}/*`],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["kafkaconnect:CreateCustomPlugin"],
          resources: ["*"],
        }),
      ]),
      onUpdate: {
        service: "KafkaConnect",
        action: "createCustomPlugin",
        physicalResourceId: PhysicalResourceId.of("customConnectorPlugin"),
        parameters: {
          contentType: "ZIP",
          location: {
            s3Location: {
              bucketArn: `arn:aws:s3:::${PLUGIN_BUCKET}`,
              fileKey: PLUGIN_FILE,
            },
          },
          name: "kafka-connect-connector-plugin",
          description: "connector plugin",
        },
      },
      onCreate: {
        service: "KafkaConnect",
        action: "createCustomPlugin",
        physicalResourceId: PhysicalResourceId.of("customConnectorPlugin"),
        parameters: {
          contentType: "ZIP",
          location: {
            s3Location: {
              bucketArn: `arn:aws:s3:::${PLUGIN_BUCKET}`,
              fileKey: PLUGIN_FILE,
            },
          },
          name: "kafka-connect-connector-plugin",
          description: "connector plugin",
        },
      },
    });

    const deletePlugin = new AwsCustomResource(
      this,
      "msk-connect-plugin-delete",
      {
        policy: AwsCustomResourcePolicy.fromStatements([
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["kafkaconnect:DeleteCustomPlugin"],
            resources: ["*"],
          }),
        ]),
        onDelete: {
          service: "KafkaConnect",
          action: "deleteCustomPlugin",
          parameters: {
            customPluginArn: plugin
              .getResponseFieldReference("customPluginArn")
              .toString(),
          },
        },
      }
    );
    deletePlugin.node.addDependency(plugin);

    const boostrapParam = StringParameter.fromStringParameterName(
      this,
      "msk-brokers-from-param",
      "/msk/bootstrap-brokers"
    );

    const sgParam = StringParameter.fromStringParameterName(
      this,
      "msk-brokers-from-param",
      "/msk/cluster-sg"
    );

    const vpc = Vpc.fromLookup(this, "msk-vpc-lookup", {
      vpcName: "msk-vpc",
    });

    const weatherFunction = new NodejsFunction(this, "weather-handler", {
      functionName: "weather-handler",
      entry: "./handlers/weather-handler",
      handler: "weather-handler",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        BOOTSTRAP_SERVERS: boostrapParam.stringValue,
        NODE_ENV: "prod",
      },
    });

    const mskConnectRole = new Role(this, "MskConnectRole", {
      assumedBy: new ServicePrincipal("kafkaconnect.amazonaws.com"),
    });
    mskConnectRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["lambda:InvokeFunction", "lambda:GetFunction"],
        resources: ["*"], // TODO: lambda arn
      })
    );

    const kafkaConnectS3SinkConfig = {
      "connector.class":
        "io.confluent.connect.aws.lambda.AwsLambdaSinkConnector",
      "tasks.max": "1",
      topics: "nicks_topic", // Replace with your Kafka topic
      "aws.lambda.function.name": "<Required Configuration>", // TODO: lambda name
      "aws.lambda.invocation.type": "sync",
      "aws.lambda.batch.size": "50",
      "format.class": "io.confluent.connect.s3.format.json.JsonFormat",
    };

    const props: CfnConnectorProps = {
      connectorConfiguration: JSON.parse(
        JSON.stringify(kafkaConnectS3SinkConfig)
      ),
      connectorName: "msk-s3-sink-connector",
      kafkaCluster: {
        apacheKafkaCluster: {
          bootstrapServers: boostrapParam.stringValue,
          vpc: {
            securityGroups: [sgParam.stringValue],
            subnets: vpc.privateSubnets.map((s) => s.subnetId),
          },
        },
      },
      capacity: {
        autoScaling: {
          maxWorkerCount: 1,
          mcuCount: 1,
          minWorkerCount: 1,
          scaleInPolicy: {
            cpuUtilizationPercentage: 50,
          },
          scaleOutPolicy: {
            cpuUtilizationPercentage: 80,
          },
        },
      },
      kafkaClusterClientAuthentication: {
        authenticationType: "NONE",
      },
      kafkaClusterEncryptionInTransit: {
        encryptionType: "PLAINTEXT",
      },
      kafkaConnectVersion: "2.7.1",
      plugins: [
        {
          customPlugin: {
            customPluginArn: plugin
              .getResponseFieldReference("customPluginArn")
              .toString(),
            revision: 1,
          },
        },
      ],
      serviceExecutionRoleArn: mskConnectRole.roleArn,
    };

    const mskConnect = new CfnConnector(this, "MskConnector", props);

    mskConnect.node.addDependency(plugin);
  }
}
