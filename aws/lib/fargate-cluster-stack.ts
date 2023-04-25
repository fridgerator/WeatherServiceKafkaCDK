import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class FargateClusterStack extends Stack {
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
      clusterName: "weather-service-cluster",
      vpc,
    });

    new StringParameter(this, "cluster-arn", {
      stringValue: cluster.clusterArn,
      parameterName: "/msk/fargate-cluster-arn",
    });
  }
}
