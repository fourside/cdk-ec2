import { isRunning, boot } from "../shared/ec2Client";

export async function handler(event: any): Promise<void> {
  console.log(JSON.stringify(event));

  try {
    const instanceId = process.env.INSTANCE_ID;
    if (!instanceId) {
      throw new Error("not passed INSTANCE_ID via env");
    }
    const running = await isRunning(instanceId, { ignoreAutoStop: true });
    if (running) {
      console.log(`instance: ${instanceId} is running.`);
      return;
    }
    const result = await boot(instanceId);
    if (result) {
      console.log(`start instance: ${instanceId}`);
    } else {
      console.log(`cannot start instance: ${instanceId}. something wrong.`);
    }
  } catch (e) {
    console.log("error", e);
  }
}
