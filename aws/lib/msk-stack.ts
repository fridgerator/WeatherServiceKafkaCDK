import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Vpc,
  Instance,
  InstanceType,
  InstanceSize,
  InstanceClass,
  SecurityGroup,
  MachineImage,
  AmazonLinuxGeneration,
  SubnetType,
  Peer,
  Port,
} from "aws-cdk-lib/aws-ec2";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import * as fs from "fs";
import { Cluster, KafkaVersion } from "@aws-cdk/aws-msk-alpha";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";

export class MskStack extends Stack {
  props: StackProps;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    this.props = props;
    this.build();
  }

  build() {
    const vpc = new Vpc(this, "msk-vpc", {
      maxAzs: 2,
      vpcName: "msk-vpc",
    });

    const configuration = new AwsCustomResource(this, "create-msk-config", {
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["kafka:CreateConfiguration"],
          resources: ["*"],
        }),
      ]),
      onCreate: {
        service: "Kafka",
        action: "createConfiguration",
        physicalResourceId: PhysicalResourceId.of("kafkaConfig"),
        parameters: {
          Name: "MskClusterConfig",
          Description: "MSK cluster config",
          ServerProperties: "auto.create.topics.enable = true",
        },
      },
      onUpdate: {
        service: "Kafka",
        action: "createConfiguration",
        parameters: {
          Name: "MskClusterConfig",
          Description: "MSK cluster config",
          ServerProperties: "auto.create.topics.enable = true",
        },
      },
    });

    const deleteConfiguration = new AwsCustomResource(
      this,
      "delete-msk-config",
      {
        policy: AwsCustomResourcePolicy.fromStatements([
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["kafka:DeleteConfiguration"],
            resources: ["*"],
          }),
        ]),
        onDelete: {
          service: "Kafka",
          action: "deleteConfiguration",
          parameters: {
            arn: configuration.getResponseField("Arn"),
          },
        },
      }
    );
    deleteConfiguration.node.addDependency(configuration);

    const mskCluster = new Cluster(this, "msk-cluster", {
      clusterName: "msk-cluster",
      kafkaVersion: KafkaVersion.V2_8_1,
      numberOfBrokerNodes: 2,
      vpc,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      removalPolicy: RemovalPolicy.DESTROY,
      configurationInfo: {
        arn: configuration.getResponseField("Arn"),
        revision: 1,
      },
    });
    mskCluster.node.addDependency(configuration);

    mskCluster.connections.allowFrom(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(9094),
      "Allow connections from vpc"
    );

    new CfnOutput(this, "msk-brokers-out", {
      value: mskCluster.bootstrapBrokersTls,
    });

    new StringParameter(this, "msk-brokers-ssm", {
      stringValue: mskCluster.bootstrapBrokersTls,
      parameterName: "/msk/bootstrap-brokers",
    });

    new StringParameter(this, "msk-cluster-arn", {
      stringValue: mskCluster.clusterArn,
      parameterName: "/msk/cluster-arn",
    });

    new StringParameter(this, "msk-cluster-sg", {
      stringValue: mskCluster.connections.securityGroups[0].securityGroupId,
      parameterName: "/msk/cluster-sg",
    });

    const instanceSG = new SecurityGroup(this, "instance-sg", {
      vpc,
      description: "Allow traffic for session manager",
      allowAllOutbound: true,
    });

    const instanceRole = new Role(this, "instance-role", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });
    instanceRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // instance for session manager
    const privateInstance = new Instance(this, "private-instance", {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: instanceSG,
      role: instanceRole,
    });
    privateInstance.addUserData(fs.readFileSync("lib/user_data.sh", "utf-8"));
  }
}
