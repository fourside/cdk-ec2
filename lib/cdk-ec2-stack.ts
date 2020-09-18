import { Stack, StackProps, Construct, Duration } from "@aws-cdk/core";
import {
  Vpc,
  SecurityGroup,
  Peer,
  Port,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  MachineImage,
  CfnEIP,
} from "@aws-cdk/aws-ec2";
import { CfnOutput, Tags } from "@aws-cdk/core";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Runtime } from "@aws-cdk/aws-lambda";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";
import { RetentionDays } from "@aws-cdk/aws-logs";
import { Role, ManagedPolicy, ServicePrincipal, PolicyStatement, Effect } from "@aws-cdk/aws-iam";
import * as path from "path";

export class CdkEc2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const myIp = process.env.MY_IP || "";
    if (!myIp) {
      throw new Error("set env MY_IP");
    }
    const keyName = process.env.KEY_NAME || "";
    if (!keyName) {
      throw new Error("set env KEY_NAME");
    }
    const region = process.env.CDK_DEFAULT_REGION || "ap-northeast-1";

    const vpc = Vpc.fromLookup(this, "VPC", {
      isDefault: true,
    });

    const securityGroup = new SecurityGroup(this, "fromMyPC", {
      vpc: vpc,
      securityGroupName: "ssh from my pc",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(Peer.ipv4(myIp), Port.tcp(22));

    const UBUNTU_20_04_IMAGE_ID = "ami-09b86f9709b3c33d4";
    const imageId = process.env.IMAGE_ID || UBUNTU_20_04_IMAGE_ID;

    const instance = new Instance(this, "instance", {
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpc: vpc,
      machineImage: MachineImage.genericLinux({ [region]: imageId }),
      securityGroup: securityGroup,
      keyName: keyName,
    });
    const elasticIP = new CfnEIP(this, "elasticIP", {
      instanceId: instance.instanceId,
    });

    Tags.of(instance).add("autoStop", "true");

    const role = new Role(this, "lambdaEc2Role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const ec2StartStopPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StartInstances", "ec2:StopInstances"],
      resources: [`arn:aws:ec2:${region}:*:instance/*`],
    });
    const ec2DescribePolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:DescribeInstances"],
      resources: ["*"],
    });
    role.addToPolicy(ec2StartStopPolicyStatement);
    role.addToPolicy(ec2DescribePolicyStatement);

    const lambdaOptions = {
      environment: {
        INSTANCE_ID: instance.instanceId,
      },
      runtime: Runtime.NODEJS_12_X,
      logRetention: RetentionDays.ONE_MONTH,
      timeout: Duration.minutes(3),
      sourceMaps: true,
      role: role,
    };

    const autoBootLambda = new NodejsFunction(this, "autoBoot", {
      entry: path.join(__dirname, "../lambda/autoBoot/index.ts"),
      handler: "handler",
      cacheDir: ".parcel-cache/autoBoot",
      ...lambdaOptions,
    });

    const autoShutdownLambda = new NodejsFunction(this, "autoShutdown", {
      entry: path.join(__dirname, "../lambda/autoShutdown/index.ts"),
      handler: "handler",
      cacheDir: ".parcel-cache/autoShutdown",
      ...lambdaOptions,
    });

    new Rule(this, "autoBootRule", {
      schedule: Schedule.cron({
        minute: "0",
        hour: "1", // JST 10
        weekDay: "MON-FRI",
      }),
      targets: [new LambdaFunction(autoBootLambda)],
    });

    new Rule(this, "autoShutdownRule", {
      schedule: Schedule.cron({
        minute: "0",
        hour: "11", // JST 20
      }),
      targets: [new LambdaFunction(autoShutdownLambda)],
    });

    new CfnOutput(this, "IP address", { value: elasticIP.ref });
  }
}
