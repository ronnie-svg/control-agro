const movementKey = "control-agro-movements";
const cropsKey = "iturribero-crops";
const livestockKey = "iturribero-livestock";
const scriptUrlKey = "control-agro-script-url";
const syncQueueKey = "control-agro-sync-queue";

export const defaultScriptUrl = "https://script.google.com/macros/s/AKfycbz06zQqqae3xaHIXWtFvIemTCqO8zovpckmFi9OHcQlqh6U3fFn6ugG61dk6Hxbxv-X/exec";

function readList(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function writeList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getMovements() {
  return readList(movementKey);
}

export function saveMovements(movements) {
  writeList(movementKey, movements);
}

export function getCrops() {
  return readList(cropsKey);
}

export function saveCrops(crops) {
  writeList(cropsKey, crops);
}

export function getLivestock() {
  return readList(livestockKey);
}

export function saveLivestock(animals) {
  writeList(livestockKey, animals);
}

export function getScriptUrl() {
  return localStorage.getItem(scriptUrlKey) || defaultScriptUrl;
}

export function saveScriptUrl(value) {
  localStorage.setItem(scriptUrlKey, value.trim());
}

export function getSyncQueue() {
  return readList(syncQueueKey);
}

export function saveSyncQueue(items) {
  writeList(syncQueueKey, items);
}
