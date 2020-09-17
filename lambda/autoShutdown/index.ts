import { isRunning, shutdown } from "../shared/ec2Client";

export async function handler(event: any): Promise<void> {
  console.log(JSON.stringify(event));

  try {
    const instanceId = process.env.INSTANCE_ID;
    if (!instanceId) {
      throw new Error("not passed INSTANCE_ID via env");
    }
    const running = await isRunning(instanceId);
    if (!running) {
      console.log(`instance: ${instanceId} is not running.`);
      return;
    }
    const result = await shutdown(instanceId);
    if (result) {
      console.log(`stop instance: ${instanceId}`);
    } else {
      console.log(`cannot stop instance: ${instanceId}. something wrong.`);
    }
  } catch (e) {
    console.log("error", e);
  }
}
