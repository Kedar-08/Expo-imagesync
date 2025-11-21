import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import {
  getPendingAssets,
  reservePendingAssets,
  markUploaded,
  markFailed,
  setPending,
  incrementRetryCapped,
} from "../db/db";
import { syncEventBus } from "./SyncEventBus";
import { uploadPhoto } from "../utils/api";
import * as Network from "expo-network";
import type {
  LocalAssetRecord,
  QueueMetrics,
  ServerUploadResponse,
} from "../types";

const MAX_CONCURRENT_UPLOADS = 3;
const BATCH_SIZE = 5;
const MAX_RETRIES = 5;
const API_BASE_URL = "https://example.com"; // TODO: Replace with actual API

export class QueueManager {
  private metrics$ = new BehaviorSubject<QueueMetrics>(
    this.getInitialMetrics()
  );
  private processingAssets = new Map<number, Promise<void>>();
  private isPaused = false;
  private isProcessing = false;
  private completedCount = 0;
  private failedCount = 0;
  private uploadTimes: number[] = [];

  constructor() {
    // Don't initialize queue in constructor - let it initialize on first use
  }

  private async initializeQueue(): Promise<void> {
    try {
      const pending = await getPendingAssets(100);
      this.updateMetrics();
    } catch (error) {
      // Silently ignore - table may not exist yet
    }
  }

  async enqueue(assetId: number): Promise<void> {
    await this.updateMetrics();
    syncEventBus.emitAssetQueued(assetId);

    if (!this.isProcessing && !this.isPaused) {
      void this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || this.isPaused) return;

    // Check if device is online before processing
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected) {
      return; // Device is offline, don't process
    }

    this.isProcessing = true;

    try {
      // Ensure queue is initialized
      await this.initializeQueue();

      let batch = await reservePendingAssets(BATCH_SIZE);

      while (batch.length > 0 && !this.isPaused) {
        const concurrentCount = this.processingAssets.size;

        if (concurrentCount >= MAX_CONCURRENT_UPLOADS) {
          await Promise.race(Array.from(this.processingAssets.values()));
          continue;
        }

        for (const asset of batch) {
          const promise = this.uploadAsset(asset);
          this.processingAssets.set(asset.id, promise);
          promise.finally(() => this.processingAssets.delete(asset.id));
        }

        this.updateMetrics();
        await new Promise((r) => setTimeout(r, 500));

        batch = await reservePendingAssets(BATCH_SIZE);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async uploadAsset(asset: LocalAssetRecord): Promise<void> {
    const startTime = Date.now();
    syncEventBus.emitAssetUploading(asset.id);

    try {
      const response = await this.uploadOne(asset);

      if (response.status === "ok") {
        await markUploaded(asset.id, response.serverId);
        const duration = Date.now() - startTime;
        this.uploadTimes.push(duration);
        this.completedCount++;
        syncEventBus.emitAssetUploaded(asset.id, response.serverId, duration);
        await this.updateMetrics();
      } else {
        throw new Error("Server returned error status");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.handleUploadFailure(asset.id, errorMsg);
    }
  }

  private async handleUploadFailure(
    assetId: number,
    errorMsg: string
  ): Promise<void> {
    const newRetries = await incrementRetryCapped(assetId, MAX_RETRIES);

    if (newRetries >= MAX_RETRIES) {
      await markFailed(assetId);
      this.failedCount++;
      syncEventBus.emitAssetFailed(assetId, errorMsg, true);
    } else {
      await setPending(assetId);
      const backoffMs = this.calculateBackoff(newRetries);
      syncEventBus.emitAssetRetrying(assetId, newRetries, backoffMs, errorMsg);

      await new Promise((r) => setTimeout(r, backoffMs));
      void this.enqueue(assetId);
    }

    this.updateMetrics();
  }

  private async uploadOne(
    asset: LocalAssetRecord
  ): Promise<ServerUploadResponse> {
    // Actually upload to server - will throw error if offline or server unreachable
    return await uploadPhoto(asset);
  }

  private calculateBackoff(attempt: number): number {
    const baseDelay = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
    const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
    return Math.max(1000, baseDelay + jitter);
  }

  getMetrics(): QueueMetrics {
    return this.metrics$.value;
  }

  getMetrics$(): Observable<QueueMetrics> {
    return this.metrics$.asObservable();
  }

  private async updateMetrics(): Promise<void> {
    // Get actual pending count from database
    const pending = await getPendingAssets(1000).catch(() => []);
    const totalQueued = pending.length;

    const metrics: QueueMetrics = {
      totalQueued,
      inProgress: this.processingAssets.size,
      completed: this.completedCount,
      failed: this.failedCount,
      averageUploadTime:
        this.uploadTimes.length > 0
          ? this.uploadTimes.reduce((a, b) => a + b, 0) /
            this.uploadTimes.length
          : 0,
      errorRate:
        this.completedCount + this.failedCount > 0
          ? this.failedCount / (this.completedCount + this.failedCount)
          : 0,
      lastSyncTime: Date.now(),
    };

    this.metrics$.next(metrics);
  }

  private getInitialMetrics(): QueueMetrics {
    return {
      totalQueued: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      averageUploadTime: 0,
      errorRate: 0,
      lastSyncTime: 0,
    };
  }
}

// Singleton instance
let queueManagerInstance: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
  }
  return queueManagerInstance;
}

export default getQueueManager();
