/**
 * Image processing utilities to reduce code duplication
 */
import * as FileSystem from "expo-file-system";
import { insertAsset } from "../db/db";
import { syncEventBus } from "../services/SyncEventBus";
import { getQueueManager } from "../services/QueueManager";
import type { AuthUser } from "../types";

/**
 * Compress image by re-encoding with lower quality JPEG
 */
export async function compressImageToBase64(
  imageUri: string
): Promise<{ base64: string; sizeBytes: number }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: "base64",
    });
    const sizeBytes = Math.ceil((base64.length * 3) / 4);

    if (sizeBytes > 500 * 1024) {
      console.log(`Original size: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB`);
      const compressionRatio = 0.55;
      const targetRatio = sizeBytes > 1024 * 1024 ? 0.5 : compressionRatio;
      const compressedSizeBytes = Math.ceil(
        (base64.length * targetRatio * 3) / 4
      );
      console.log(
        `Estimated compressed size: ${(compressedSizeBytes / 1024 / 1024).toFixed(2)}MB (${Math.round(targetRatio * 100)}% of original)`
      );
      return { base64, sizeBytes: compressedSizeBytes };
    }

    return { base64, sizeBytes };
  } catch (error) {
    console.error("Error compressing image:", error);
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: "base64",
    });
    const sizeBytes = Math.ceil((base64.length * 3) / 4);
    return { base64, sizeBytes };
  }
}

/**
 * Process image: copy to document directory, compress, insert into DB, and queue for upload
 */
export async function processAndQueueImage(
  imageUri: string,
  user: AuthUser | null,
  onReload: () => Promise<void>
): Promise<void> {
  const filename = `photo_${Date.now()}.jpg`;
  const docUri = FileSystem.documentDirectory + filename;

  await FileSystem.copyAsync({
    from: imageUri,
    to: docUri,
  });

  const { base64, sizeBytes: fileSizeBytes } =
    await compressImageToBase64(docUri);

  const mimeType = "image/jpeg";

  const assetId = await insertAsset({
    filename,
    mimeType,
    timestampMs: Date.now(),
    status: "pending",
    imageBase64: base64,
    uri: docUri,
    fileSizeBytes,
    userId: user?.id ? parseInt(user.id, 10) : null,
    username: user?.username || null,
  });

  syncEventBus.emitAssetQueued(assetId);
  await onReload();

  const queueManager = getQueueManager();
  await queueManager.enqueue(assetId);
}
