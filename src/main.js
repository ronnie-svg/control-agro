import { renderIconSprite } from "./components/icons.js";
import { renderHeader } from "./components/header.js";
import { renderBottomNav } from "./components/bottom-nav.js";
import { renderAddScreen } from "./screens/add.js";
import { renderHomeScreen } from "./screens/home.js";
import { renderReportScreen } from "./screens/report.js";
import { renderMovementFormScreen } from "./screens/movement-form.js";
import { renderCropsScreen } from "./screens/crops.js";
import { renderLivestockScreen } from "./screens/livestock.js";
import { renderSettingsDialog } from "./screens/settings.js";
import { categories } from "./data/categories.js";
import {
  getCrops,
  getLivestock,
  getMovements,
  getScriptUrl,
  saveCrops,
  saveLivestock,
  saveMovements,
  saveScriptUrl
} from "./data/storage.js";
import { sendToSheet } from "./data/api.js";
import { money, parseAmount } from "./utils/format.js";
import { readAttachment } from "./utils/files.js";

function renderAppShell() {
  document.querySelector("#app").innerHTML = `
    ${renderIconSprite()}
    ${renderHeader()}
    ${renderReportScreen()}
    ${renderHomeScreen()}
    ${renderAddScreen()}
    ${renderCropsScreen()}
    ${renderLivestockScreen()}
    ${renderMovementFormScreen()}
    ${renderSettingsDialog()}
    ${renderBottomNav()}
  `;
}

function setType(type) {
  document.querySelector("#type").value = type;
  document.querySelector("#formTitle").textContent = `Nuevo ${type.toLowerCase()}`;

  const categorySelect = document.querySelector("#category");
  categorySelect.innerHTML = "";
  categories[type].forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
}

function showScreen(screen) {
  document.querySelector(".app").scrollTo({ top: 0, behavior: "auto" });

  document.querySelectorAll(".nav-action").forEach((button) => {
    const active = button.dataset.screen === screen || (["Ingreso", "Gasto", "Inversion"].includes(screen) && button.dataset.screen === "Anadir");
    button.classList.toggle("active", active);
  });

  document.querySelectorAll(".screen").forEach((panel) => {
    const shouldShow = screen === "Inicio"
        ? panel.dataset.panel === "Inicio"
        : screen === "Resumen"
          ? panel.dataset.panel === "Resumen"
          : screen === "Anadir"
            ? panel.dataset.panel === "Anadir"
            : screen === "Cultivos"
              ? panel.dataset.panel === "Cultivos"
              : screen === "Ganado"
                ? panel.dataset.panel === "Ganado"
                : panel.dataset.panel === "Movimiento";
    panel.classList.toggle("hidden", !shouldShow);
  });

  if (screen === "Resumen") updateReport();
  if (screen === "Cultivos") renderCrops();
  if (screen === "Ganado") renderLivestock();

  if (screen !== "Inicio" && screen !== "Resumen" && screen !== "Anadir" && screen !== "Cultivos" && screen !== "Ganado") {
    setType(screen);
    document.querySelector("#amount").focus();
  }
}

function updateLivestockSummary() {
  const activeAnimals = getLivestock().filter((animal) => animal.status === "Activo");
  const cows = activeAnimals.filter((animal) => animal.type === "Vaca").length;
  const calves = activeAnimals.filter((animal) => animal.type === "Ternero").length;

  document.querySelector("#livestockTotal").textContent = activeAnimals.length;
  document.querySelector("#cowTotal").textContent = cows;
  document.querySelector("#calfTotal").textContent = calves;
}

function updateCropSummary() {
  const crops = getCrops();
  const hectares = crops.reduce((sum, crop) => sum + (Number(crop.hectares) || 0), 0);
  const harvested = crops.filter((crop) => crop.harvestDate || crop.production).length;

  document.querySelector("#cropTotal").textContent = crops.length;
  document.querySelector("#cropHectaresTotal").textContent = hectares.toLocaleString("es-ES", {
    maximumFractionDigits: 2
  });
  document.querySelector("#harvestedTotal").textContent = harvested;
}

function updateSummary() {
  const now = new Date();
  const movements = getMovements().filter((movement) => {
    const date = new Date(movement.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const income = movements
    .filter((movement) => movement.type === "Ingreso")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const expenses = movements
    .filter((movement) => movement.type === "Gasto")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const investments = movements
    .filter((movement) => movement.type === "Inversion")
    .reduce((sum, movement) => sum + movement.amount, 0);

  document.querySelector("#monthIncome").textContent = money(income);
  document.querySelector("#monthExpenses").textContent = money(expenses + investments);
  document.querySelector("#monthResult").textContent = money(income - expenses - investments);
  updateReport();
}

function updateReport() {
  const year = new Date().getFullYear();
  const movements = getMovements().filter((movement) => {
    return new Date(movement.date).getFullYear() === year;
  });
  const income = movements
    .filter((movement) => movement.type === "Ingreso")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const expenses = movements
    .filter((movement) => movement.type === "Gasto")
    .reduce((sum, movement) => sum + movement.amount, 0);
  const investments = movements
    .filter((movement) => movement.type === "Inversion")
    .reduce((sum, movement) => sum + movement.amount, 0);

  document.querySelector("#yearIncome").textContent = money(income);
  document.querySelector("#yearExpenses").textContent = money(expenses);
  document.querySelector("#yearInvestments").textContent = money(investments);
  document.querySelector("#yearResult").textContent = money(income - expenses - investments);

  const byCategory = movements.reduce((grouped, movement) => {
    grouped[movement.category] = (grouped[movement.category] || 0) + movement.amount;
    return grouped;
  }, {});
  const rows = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const report = document.querySelector("#categoryReport");
  report.innerHTML = rows.length
    ? rows.map(([category, total]) => `<div class="category-row"><span>${category}</span><strong>${money(total)}</strong></div>`).join("")
    : '<p class="status">Todavia no hay datos para resumir.</p>';
}

function renderRecent() {
  const movements = getMovements().slice(0, 8);
  const recentList = document.querySelector("#recentList");
  recentList.innerHTML = "";

  if (!movements.length) {
    recentList.innerHTML = '<p class="status">Todavia no hay movimientos.</p>';
    return;
  }

  movements.forEach((movement) => {
    const item = document.createElement("article");
    item.className = `movement ${movement.type}`;
    item.innerHTML = `
      <div class="movement-main">
        <span>${movement.category}</span>
        <span>${money(movement.amount)}</span>
      </div>
      <div class="movement-meta">${movement.date} - ${movement.type} - ${movement.activity}</div>
      <div class="movement-meta">${[movement.party, movement.asset, movement.notes, movement.attachmentName].filter(Boolean).join(" - ")}</div>
    `;
    recentList.append(item);
  });
}

function renderCrops() {
  updateCropSummary();
  const crops = getCrops().slice(0, 10);
  const cropList = document.querySelector("#cropList");
  cropList.innerHTML = "";

  if (!crops.length) {
    cropList.innerHTML = '<p class="status">Todavia no hay parcelas registradas.</p>';
    return;
  }

  crops.forEach((crop) => {
    const item = document.createElement("article");
    item.className = "movement";
    item.innerHTML = `
      <div class="movement-main">
        <span>${crop.parcel} - ${crop.crop}</span>
        <span>${crop.hectares} ha</span>
      </div>
      <div class="movement-meta">Campana ${crop.campaign}${crop.sowDate ? ` - siembra ${crop.sowDate}` : ""}</div>
      <div class="movement-meta">${[crop.harvestDate ? `cosecha ${crop.harvestDate}` : "", crop.production, crop.notes].filter(Boolean).join(" - ")}</div>
    `;
    cropList.append(item);
  });
}

function renderLivestock() {
  updateLivestockSummary();
  const animals = getLivestock().slice(0, 12);
  const livestockList = document.querySelector("#livestockList");
  livestockList.innerHTML = "";

  if (!animals.length) {
    livestockList.innerHTML = '<p class="status">Todavia no hay animales registrados.</p>';
    return;
  }

  animals.forEach((animal) => {
    const item = document.createElement("article");
    item.className = "movement";
    item.innerHTML = `
      <div class="movement-main">
        <span>${animal.ref} - ${animal.type}</span>
        <span>${animal.status}</span>
      </div>
      <div class="movement-meta">${[animal.sex, animal.birthDate ? `nac. ${animal.birthDate}` : "", animal.group].filter(Boolean).join(" - ")}</div>
      <div class="movement-meta">${animal.notes || ""}</div>
    `;
    livestockList.append(item);
  });
}

function resetMovementForm() {
  const form = document.querySelector("#movementForm");
  form.reset();
  document.querySelector("#date").valueAsDate = new Date();
  setType(document.querySelector("#type").value);
  document.querySelector("#amount").focus();
}

function exportCsv() {
  const headers = ["fecha", "tipo", "categoria", "importe", "actividad", "parcela_animal_lote", "proveedor_cliente", "notas", "adjunto"];
  const rows = getMovements().map((movement) => [
    movement.date,
    movement.type,
    movement.category,
    movement.amount,
    movement.activity,
    movement.asset,
    movement.party,
    movement.notes,
    movement.attachmentName
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value || "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "movimientos-control-agro.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  document.querySelectorAll(".home-action, .nav-action").forEach((button) => {
    button.addEventListener("click", () => showScreen(button.dataset.screen));
  });

  document.querySelector("#backHome").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#backHomeFromAdd").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#backHomeFromReport").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#backHomeFromCrops").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#backHomeFromLivestock").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#exportButton").addEventListener("click", exportCsv);

  document.querySelector("#settingsButton").addEventListener("click", () => {
    document.querySelector("#settingsDialog").showModal();
  });

  document.querySelector("#saveSettings").addEventListener("click", () => {
    saveScriptUrl(document.querySelector("#scriptUrl").value);
    document.querySelector("#settingsDialog").close();
  });

  document.querySelector("#cropForm").addEventListener("submit", handleCropSubmit);
  document.querySelector("#livestockForm").addEventListener("submit", handleLivestockSubmit);
  document.querySelector("#movementForm").addEventListener("submit", handleMovementSubmit);
}

async function handleLivestockSubmit(event) {
  event.preventDefault();

  const animal = {
    recordKind: "livestock",
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ref: document.querySelector("#animalRef").value.trim(),
    type: document.querySelector("#animalType").value,
    sex: document.querySelector("#animalSex").value,
    birthDate: document.querySelector("#animalBirthDate").value,
    group: document.querySelector("#animalGroup").value.trim(),
    status: document.querySelector("#animalStatus").value,
    notes: document.querySelector("#animalNotes").value.trim()
  };

  const livestockStatus = document.querySelector("#livestockStatus");
  if (!animal.ref || !animal.type || !animal.status) {
    livestockStatus.textContent = "Revisa identificador, tipo y estado.";
    return;
  }

  saveLivestock([animal, ...getLivestock()]);
  renderLivestock();
  livestockStatus.textContent = "Guardado en el movil.";

  try {
    await sendToSheet(animal);
    livestockStatus.textContent = "Guardado en el movil y enviado a Google Sheets.";
  } catch {
    livestockStatus.textContent = "Guardado en el movil. No se pudo enviar a Google Sheets.";
  }

  document.querySelector("#livestockForm").reset();
}

async function handleCropSubmit(event) {
  event.preventDefault();

  const crop = {
    recordKind: "crop",
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    parcel: document.querySelector("#cropParcel").value.trim(),
    hectares: parseAmount(document.querySelector("#cropHectares").value),
    crop: document.querySelector("#cropName").value.trim(),
    campaign: document.querySelector("#cropCampaign").value.trim(),
    sowDate: document.querySelector("#cropSowDate").value,
    harvestDate: document.querySelector("#cropHarvestDate").value,
    production: document.querySelector("#cropProduction").value.trim(),
    notes: document.querySelector("#cropNotes").value.trim()
  };

  const cropStatus = document.querySelector("#cropStatus");
  if (!crop.parcel || !crop.crop || !crop.campaign || !Number.isFinite(crop.hectares) || crop.hectares <= 0) {
    cropStatus.textContent = "Revisa parcela, hectareas, cultivo y campana.";
    return;
  }

  saveCrops([crop, ...getCrops()]);
  renderCrops();
  cropStatus.textContent = "Guardado en el movil.";

  try {
    await sendToSheet(crop);
    cropStatus.textContent = "Guardado en el movil y enviado a Google Sheets.";
  } catch {
    cropStatus.textContent = "Guardado en el movil. No se pudo enviar a Google Sheets.";
  }

  document.querySelector("#cropForm").reset();
}

async function handleMovementSubmit(event) {
  event.preventDefault();
  const amount = parseAmount(document.querySelector("#amount").value);
  const statusText = document.querySelector("#status");

  if (!Number.isFinite(amount) || amount <= 0) {
    statusText.textContent = "Revisa el importe.";
    return;
  }

  const attachment = await readAttachment();
  const movement = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    date: document.querySelector("#date").value,
    type: document.querySelector("#type").value,
    category: document.querySelector("#category").value,
    amount,
    activity: document.querySelector("#activity").value,
    asset: document.querySelector("#asset").value.trim(),
    party: document.querySelector("#party").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
    attachmentName: attachment ? attachment.name : "",
    attachmentType: attachment ? attachment.type : "",
    attachmentData: attachment ? attachment.data : ""
  };

  saveMovements([{ ...movement, attachmentData: "" }, ...getMovements()]);
  updateSummary();
  renderRecent();
  renderLivestock();
  statusText.textContent = "Guardado en el movil.";

  try {
    await sendToSheet(movement);
    statusText.textContent = "Guardado en el movil y enviado a Google Sheets.";
  } catch {
    statusText.textContent = "Guardado en el movil. No se pudo enviar a Google Sheets.";
  }

  resetMovementForm();
}

function init() {
  renderAppShell();
  document.querySelector("#date").valueAsDate = new Date();
  document.querySelector("#scriptUrl").value = getScriptUrl();
  setType("Ingreso");
  bindEvents();
  updateSummary();
  renderRecent();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js");
  }
}

init();
