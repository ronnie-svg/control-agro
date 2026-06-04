import { getScriptUrl } from "./storage.js";

export async function sendToSheet(record) {
  const targetUrl = getScriptUrl();
  if (!targetUrl) return { attempted: false, confirmed: false };

  await fetch(targetUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(record)
  });
  return { attempted: true, confirmed: false };
}
