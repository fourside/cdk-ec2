import * as cdk from "@aws-cdk/core";
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

export class CdkEc2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const myIp = process.env.MY_IP || "";
    if (!myIp) {
      throw new Error("set env MY_IP");
    }
    const keyName = process.env.KEY_NAME || "";
    if (!keyName) {
      throw new Error("set env KEY_NAME");
    }

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

    const instance = new Instance(this, "instance", {
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpc: vpc,
      machineImage: MachineImage.genericLinux({ "ap-northeast-1": UBUNTU_20_04_IMAGE_ID }),
      securityGroup: securityGroup,
      keyName: keyName,
    });
    const elasticIP = new CfnEIP(this, "elasticIP", {
      instanceId: instance.instanceId,
    });

    Tags.of(instance).add("autoStop", "true");

    new CfnOutput(this, "IP address", { value: elasticIP.ref });
  }
}
