import { renderIconSprite } from "./components/icons.js";
import { renderHeader } from "./components/header.js";
import { renderBottomNav } from "./components/bottom-nav.js";
import { renderHomeScreen } from "./screens/home.js";
import { renderReportScreen } from "./screens/report.js";
import { renderMovementFormScreen } from "./screens/movement-form.js";
import { renderCropsScreen } from "./screens/crops.js";
import { renderSettingsDialog } from "./screens/settings.js";
import { categories } from "./data/categories.js";
import {
  getCrops,
  getMovements,
  getScriptUrl,
  saveCrops,
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
    ${renderCropsScreen()}
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
    const active = button.dataset.screen === screen || (["Gasto", "Inversion"].includes(screen) && button.dataset.screen === "Ingreso");
    button.classList.toggle("active", active);
  });

  document.querySelectorAll(".screen").forEach((panel) => {
    const shouldShow = screen === "Inicio"
      ? panel.dataset.panel === "Inicio"
      : screen === "Resumen"
        ? panel.dataset.panel === "Resumen"
        : screen === "Cultivos"
          ? panel.dataset.panel === "Cultivos"
          : panel.dataset.panel === "Movimiento";
    panel.classList.toggle("hidden", !shouldShow);
  });

  if (screen === "Resumen") updateReport();
  if (screen === "Cultivos") renderCrops();

  if (screen !== "Inicio" && screen !== "Resumen" && screen !== "Cultivos") {
    setType(screen);
    document.querySelector("#amount").focus();
  }
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
  document.querySelector("#backHomeFromReport").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#backHomeFromCrops").addEventListener("click", () => showScreen("Inicio"));
  document.querySelector("#exportButton").addEventListener("click", exportCsv);

  document.querySelector("#settingsButton").addEventListener("click", () => {
    document.querySelector("#settingsDialog").showModal();
  });

  document.querySelector("#saveSettings").addEventListener("click", () => {
    saveScriptUrl(document.querySelector("#scriptUrl").value);
    document.querySelector("#settingsDialog").close();
  });

  document.querySelector("#cropForm").addEventListener("submit", handleCropSubmit);
  document.querySelector("#movementForm").addEventListener("submit", handleMovementSubmit);
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
