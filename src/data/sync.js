import { sendToSheet } from "./api.js";
import { getSyncQueue, saveSyncQueue } from "./storage.js";

function withoutAttachmentData(record) {
  const copy = { ...record };
  if (copy.attachmentData) copy.attachmentData = "";
  return copy;
}

function createSyncItem(record) {
  return {
    id: record.id,
    kind: record.recordKind || "movement",
    label: record.category || record.crop || record.ref || record.type || "Registro",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    record: withoutAttachmentData(record)
  };
}

function upsertSyncItem(item) {
  const queue = getSyncQueue();
  const index = queue.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    queue[index] = { ...queue[index], ...item, updatedAt: new Date().toISOString() };
  } else {
    queue.unshift(item);
  }
  saveSyncQueue(queue.slice(0, 80));
}

export function getSyncSummary() {
  const queue = getSyncQueue();
  return {
    pending: queue.filter((item) => item.status === "pending").length,
    errors: queue.filter((item) => item.status === "error").length,
    attempted: queue.filter((item) => item.status === "attempted").length,
    items: queue
  };
}

export async function syncRecord(record) {
  const existing = getSyncQueue().find((item) => item.id === record.id);
  const item = existing || createSyncItem(record);
  upsertSyncItem({ ...item, status: "pending" });

  try {
    const result = await sendToSheet(record);
    upsertSyncItem({
      ...item,
      status: result.attempted ? "attempted" : "pending",
      attempts: item.attempts + 1,
      lastMessage: result.confirmed
        ? "Confirmado por Google Sheets."
        : "Envio intentado. Revisa la hoja para confirmar.",
      record: withoutAttachmentData(record)
    });
    return result;
  } catch {
    upsertSyncItem({
      ...item,
      status: "error",
      attempts: item.attempts + 1,
      lastMessage: "No se pudo enviar. Queda pendiente de reintento.",
      record
    });
    return { attempted: false, confirmed: false };
  }
}

export async function retryPendingSync() {
  const queue = getSyncQueue();
  const retryable = queue.filter((item) => item.status === "pending" || item.status === "error");
  for (const item of retryable) {
    await syncRecord(item.record);
  }
  return getSyncSummary();
}
