import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import QueueManager from "./QueueManager";
import * as Network from "expo-network";

const TASK_NAME = "PHOTO_SYNC_TASK";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected) {
      return (BackgroundFetch as any).Result?.NoData ?? 1;
    }
    await QueueManager.processQueue();
    return (BackgroundFetch as any).Result?.NewData ?? 0;
  } catch (err) {
    return (BackgroundFetch as any).Result?.Failed ?? 2;
  }
});

export async function registerBackgroundSync() {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      // android options could be added in eas/custom if needed
    });
  } catch (err) {
    console.warn("registerBackgroundSync failed", err);
  }
}

export async function unregisterBackgroundSync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  } catch (err) {
    console.warn("unregisterBackgroundSync failed", err);
  }
}
