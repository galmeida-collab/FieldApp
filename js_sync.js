import { SCRIPT_URL } from "./config.js";
import { dbDelete, dbGetAll } from "./db.js";

export async function uploadItem(item) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(item),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error("HTTP error " + res.status);
    const out = await res.json();
    if (out.status !== "success" || (item.id && String(out.id) !== String(item.id))) {
      throw new Error(out.message || "Server rejected record");
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

export async function triggerSync(onProgress) {
  if (!navigator.onLine) {
    throw new Error("Device is offline");
  }
  const items = await dbGetAll("outbox");
  let successCount = 0;
  let failCount = 0;

  for (const item of items) {
    try {
      await uploadItem(item);
      await dbDelete("outbox", item.id);
      successCount++;
    } catch (e) {
      console.error("Sync failed for item:", item.id, e);
      failCount++;
    }
    if (onProgress) onProgress(successCount, failCount, items.length);
  }
  return { successCount, failCount };
}