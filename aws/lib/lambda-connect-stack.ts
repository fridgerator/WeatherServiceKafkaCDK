import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import path from "path";
import { Topic } from "aws-cdk-lib/aws-sns";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import {
  AwsLogDriver,
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

export class LambdaConnectStack extends Stack {
  props: StackProps;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    this.props = props;
    this.build();
  }

  build() {
    const vpc = Vpc.fromLookup(this, "msk-vpc-lookup", {
      vpcName: "msk-vpc",
    });

    const bootstrapParam = StringParameter.fromStringParameterName(
      this,
      "msk-brokers-from-param",
      "/msk/bootstrap-brokers"
    );

    let topicsMap: { [key: string]: string } = {
      NE: "",
      TX: "",
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

    const dockerImage = new DockerImageAsset(this, "sink-fargate-image", {
      directory: path.join(__dirname, "../../src/lambda_sink"),
    });

    const securityGroupParam = StringParameter.fromStringParameterName(
      this,
      "sg",
      "/msk/cluster-sg"
    );

    const cluster = Cluster.fromClusterAttributes(this, "cluster", {
      clusterName: "weather-service-cluster",
      vpc,
      securityGroups: [
        SecurityGroup.fromSecurityGroupId(
          this,
          "sg2",
          securityGroupParam.stringValue
        ),
      ],
    });

    const logging = new AwsLogDriver({
      streamPrefix: "lambda-connect",
    });

    const taskRole = new Role(this, "task-role", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    taskRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["sns:Publish"],
        resources: ["*"],
      })
    );

    const taskDef = new FargateTaskDefinition(this, "lambda-connect-taskdef", {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskRole,
    });
    taskDef.addContainer("TaskContainer", {
      image: ContainerImage.fromDockerImageAsset(dockerImage),
      logging,
      environment: {
        NODE_ENV: "prod",
        BOOTSTRAP_SERVERS: bootstrapParam.stringValue,
        TOPICS_MAP: JSON.stringify(topicsMap),
        AWS_REGION: this.props.env?.region!,
      },
    });

    new FargateService(this, "lambda-connect-svc", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
    });
  }
}
