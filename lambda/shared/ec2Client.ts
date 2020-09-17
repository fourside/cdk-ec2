import { EC2 } from "aws-sdk";
import {
  DescribeInstancesRequest,
  DescribeInstancesResult,
  StopInstancesRequest,
  StopInstancesResult,
  StartInstancesRequest,
  StartInstancesResult,
} from "aws-sdk/clients/ec2";

const ec2 = new EC2();

export async function isRunning(instanceId: string, option = { ignoreAutoStop: false }): Promise<boolean> {
  const instances = await new Promise<DescribeInstancesResult>((resolve, reject) => {
    const params: DescribeInstancesRequest = {
      InstanceIds: [instanceId],
      Filters: [{ Name: "instance-state-code", Values: ["16"] }],
    };
    if (!option.ignoreAutoStop) {
      params.Filters?.push({ Name: "tag:autoStop", Values: ["true"] });
    }
    ec2.describeInstances(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  const exists = instances.Reservations?.some((reservation) => {
    return reservation.Instances?.some((instance) => {
      return !!instance;
    });
  });
  return !!exists;
}

export async function shutdown(instanceId: string): Promise<boolean> {
  const result = await new Promise<StopInstancesResult>((resolve, reject) => {
    const params: StopInstancesRequest = {
      InstanceIds: [instanceId],
    };
    ec2.stopInstances(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  return !!result.StoppingInstances?.length;
}

export async function boot(instanceId: string): Promise<boolean> {
  const result = await new Promise<StartInstancesResult>((resolve, reject) => {
    const params: StartInstancesRequest = {
      InstanceIds: [instanceId],
    };
    ec2.startInstances(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
  return !!result.StartingInstances?.length;
}
