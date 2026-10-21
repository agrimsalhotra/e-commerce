import cron from "node-cron";

import logger from "../config/logger.js";
import { acquireJobLock, releaseJobLock } from "./distributedLock.js";
import { releaseExpiredOrders } from "./releaseExpiredOrders.js";

const JOB_NAME = "release-expired-orders";

let scheduledTask;
let stopping = false;
let running = false;

export function startScheduledJobs() {
  scheduledTask = cron.schedule("* * * * *", async () => {
    if (stopping || running) {
      return;
    }

    running = true;

    let acquired = false;

    try {
      acquired = await acquireJobLock(JOB_NAME, 300);

      if (!acquired) {
        logger.debug(
          { jobName: JOB_NAME },
          "Job lock unavailable; skipping this tick"
        );
        return;
      }

      logger.info(
        { jobName: JOB_NAME },
        "Scheduled job started"
      );

      const processed = await releaseExpiredOrders();

      logger.info(
        { jobName: JOB_NAME, processed },
        "Scheduled job completed"
      );
    } catch (error) {
      logger.error(
        { err: error, jobName: JOB_NAME },
        "Scheduled job failed"
      );
    } finally {
      if (acquired) {
        try {
          await releaseJobLock(JOB_NAME);
        } catch (error) {
          logger.error(
            { err: error, jobName: JOB_NAME },
            "Failed to release job lock"
          );
        }
      }

      running = false;
    }
  });

  logger.info("Scheduled jobs started");
}

export async function stopScheduledJobs() {
  stopping = true;

  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = undefined;
  }

  // If a job is running, wait for it to finish before
  // shutting down the database pool.
  while (running) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  logger.info("Scheduled jobs stopped");
}