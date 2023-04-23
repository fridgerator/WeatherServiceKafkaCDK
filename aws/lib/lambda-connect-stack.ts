import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CfnAccessKey,
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
  User,
} from "aws-cdk-lib/aws-iam";
import { CfnConnector, CfnConnectorProps } from "aws-cdk-lib/aws-kafkaconnect";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

import { WEATHER_ALERTS_TOPIC } from "../utils";
import path from "path";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LogGroup } from "aws-cdk-lib/aws-logs";

const PLUGIN_BUCKET = "msk-connect-plugin-bucket";
const PLUGIN_FILE = "confluentinc-kafka-connect-aws-lambda-2.0.6.zip";

export class LambdaConnectStack extends Stack {
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
          name: "msk-connect-lambda-plugin",
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
          name: "msk-connect-lambda-plugin",
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
            customPluginArn: plugin.getResponseField("customPluginArn"),
          },
        },
      }
    );
    deletePlugin.node.addDependency(plugin);

    const bootstrapParam = StringParameter.fromStringParameterName(
      this,
      "msk-brokers-from-param",
      "/msk/bootstrap-brokers"
    );

    const sgParam = StringParameter.fromStringParameterName(
      this,
      "sg-from-param",
      "/msk/cluster-sg"
    );

    const vpc = Vpc.fromLookup(this, "msk-vpc-lookup", {
      vpcName: "msk-vpc",
    });

    let topicsMap: { [key: string]: string } = {
      NE: "",
      TS: "",
      IL: "",
      MA: "",
      TN: "",
    };

    for (let state of Object.keys(topicsMap)) {
      const topic = new Topic(this, `STATE_${state}`, {
        topicName: `STATE_${state}`,
      });
      topicsMap[state] = topic.topicArn;
    }

    const weatherFunction = new NodejsFunction(this, "lambda-sink", {
      functionName: "lambda-sink",
      entry: path.join(__dirname, "handlers", "lambda-sink/index.js"),
      handler: "lambdaSinkHandler",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        BOOTSTRAP_SERVERS: bootstrapParam.stringValue,
        NODE_ENV: "prod",
        TOPICS_MAP: JSON.stringify(topicsMap),
      },
      timeout: Duration.minutes(1),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
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
    mskConnectRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["kafka:*"],
        resources: ["*"],
      })
    );
    mskConnectRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["kafka-cluster:*"],
        resources: ["*"],
      })
    );

    const userPolicy = new ManagedPolicy(this, "connect-user-mp", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["lambda:InvokeFunction", "lambda:GetFunction"],
          resources: ["*"], // TODO: lambda arn
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["kafka:*"],
          resources: ["*"],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["kafka-cluster:*"],
          resources: ["*"],
        }),
      ],
    });

    const user = new User(this, "connect-user", {
      userName: "connect-user",
      managedPolicies: [userPolicy],
    });

    const accessKey = new CfnAccessKey(this, "connect-access-key", {
      userName: user.userName,
    });

    const lambdaConfig = {
      "connector.class":
        "io.confluent.connect.aws.lambda.AwsLambdaSinkConnector",
      "tasks.max": "1",
      topics: WEATHER_ALERTS_TOPIC,
      "aws.lambda.function.name": weatherFunction.functionName,
      "aws.lambda.invocation.type": "async",
      "aws.lambda.batch.size": "50",
      "aws.access.key.id": accessKey.ref,
      "aws.secret.access.key": accessKey.attrSecretAccessKey,
      "format.class": "io.confluent.connect.s3.format.json.JsonFormat",
      "aws.lambda.region": this.props.env?.region!,
      "confluent.topic.bootstrap.servers": bootstrapParam.stringValue,
      "reporter.error.topic.replication.factor": "1",
      "reporter.bootstrap.servers": bootstrapParam.stringValue,
      "bootstrap.servers": bootstrapParam.stringValue,
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "group.id": "msk-lambda-group",
    };

    const props: CfnConnectorProps = {
      connectorConfiguration: lambdaConfig,
      connectorName: "msk-lambda-sink-connector",
      kafkaCluster: {
        apacheKafkaCluster: {
          bootstrapServers: bootstrapParam.stringValue,
          vpc: {
            securityGroups: [sgParam.stringValue],
            subnets: vpc.privateSubnets.map((s) => s.subnetId),
          },
        },
      },
      capacity: {
        autoScaling: {
          maxWorkerCount: 2,
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
        encryptionType: "TLS",
      },
      kafkaConnectVersion: "2.7.1",
      plugins: [
        {
          customPlugin: {
            customPluginArn: plugin.getResponseField("customPluginArn"),
            revision: 1,
          },
        },
      ],
      serviceExecutionRoleArn: mskConnectRole.roleArn,
      logDelivery: {
        workerLogDelivery: {
          cloudWatchLogs: {
            enabled: true,
            logGroup: new LogGroup(this, "lambda-connect-cw-logs", {
              removalPolicy: RemovalPolicy.RETAIN,
            }).logGroupName,
          },
        },
      },
    };

    const mskConnect = new CfnConnector(this, "MskConnector", props);

    mskConnect.node.addDependency(deletePlugin);
  }
}
