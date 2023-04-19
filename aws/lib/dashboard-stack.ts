import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { Cluster, ContainerImage } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import * as path from "path";

export class DashboardStack extends Stack {
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

    const cluster = new Cluster(this, "dashboard-fargate-cluster", {
      vpc,
    });

    const dockerImage = new DockerImageAsset(this, "dashboard-fargate-image", {
      directory: path.join(__dirname, "../../src/alerts_dashboard"),
    });

    const boostrapParam = StringParameter.fromStringParameterName(
      this,
      "msk-brokers-from-param",
      "/msk/bootstrap-brokers"
    );

    const service = new ApplicationLoadBalancedFargateService(
      this,
      "dashboard-fargate-svc",
      {
        cluster,
        memoryLimitMiB: 1024,
        cpu: 512,
        taskImageOptions: {
          image: ContainerImage.fromDockerImageAsset(dockerImage),
          containerPort: 8080,
          environment: {
            NODE_ENV: "prod",
            BOOTSTRAP_SERVERS: boostrapParam.stringValue,
          },
        },
        assignPublicIp: true,
      }
    );
    service.targetGroup.configureHealthCheck({
      path: "/health",
    });

    new CfnOutput(this, "service-dns", {
      value: service.loadBalancer.loadBalancerDnsName,
    });
  }
}
