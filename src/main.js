import { renderIconSprite } from "./components/icons.js";
import { renderHeader } from "./components/header.js";
import { renderBottomNav } from "./components/bottom-nav.js";
import { renderAddScreen } from "./screens/add.js";
import { renderHomeScreen } from "./screens/home.js";
import { renderReportScreen } from "./screens/report.js";
import { renderMovementFormScreen } from "./screens/movement-form.js";
import { renderCropsScreen } from "./screens/crops.js";
import { renderLivestockScreen } from "./screens/livestock.js";
import { renderDetailScreen } from "./screens/detail.js";
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
import { getSyncSummary, retryPendingSync, syncRecord } from "./data/sync.js";
import { money, parseAmount } from "./utils/format.js";
import { readAttachment } from "./utils/files.js";

const ROOT_VIEW = { screen: "Inicio" };
const TOP_LEVEL_SCREENS = new Set(["Inicio", "Resumen", "Anadir", "Cultivos", "Ganado"]);
const FORM_SCREENS = new Set(["Ingreso", "Gasto", "Inversion"]);

let currentView = { ...ROOT_VIEW };
let cropFormState = { mode: "create", recordId: null };
let livestockFormState = { mode: "create", recordId: null };

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
    ${renderDetailScreen()}
    ${renderSettingsDialog()}
    ${renderBottomNav()}
  `;
}

function normalizeView(view) {
  const screen = view?.screen || "Inicio";
  if (screen === "Detalle") {
    return {
      screen,
      detailType: view.detailType || "finance-metric",
      metric: view.metric || "",
      category: view.category || "",
      cropName: view.cropName || "",
      livestockType: view.livestockType || "",
      recordId: view.recordId || ""
    };
  }

  return {
    screen,
    mode: view?.mode || "create",
    recordId: view?.recordId || ""
  };
}

function viewSignature(view) {
  return JSON.stringify(normalizeView(view));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-ES", {
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES");
}

function countBy(items, key) {
  return items.reduce((grouped, item) => {
    grouped[item[key]] = (grouped[item[key]] || 0) + 1;
    return grouped;
  }, {});
}

function renderBreakdownRows(rows) {
  const visibleRows = rows.filter(([, value]) => value !== 0 && value !== "0 ha");
  if (!visibleRows.length) {
    return '<p class="status">Todavia no hay datos para resumir.</p>';
  }

  return visibleRows
    .map(
      ([label, value]) =>
        `<div class="breakdown-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
    )
    .join("");
}

function renderMiniBreakdown(rows) {
  const visibleRows = rows.filter(([, value]) => value !== 0 && value !== "0 ha");
  if (!visibleRows.length) return "<small>Todavia sin datos.</small>";

  return visibleRows
    .map(
      ([label, value]) =>
        `<small><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></small>`
    )
    .join("");
}

function renderClickableBreakdownRows(rows, attributeName, getValue) {
  const visibleRows = rows.filter(([, value]) => value !== 0 && value !== "0 ha");
  if (!visibleRows.length) {
    return '<p class="status">Todavia no hay datos para resumir.</p>';
  }

  return visibleRows
    .map(([label, value]) => {
      const attributeValue = escapeHtml(getValue(label));
      return `
        <button class="breakdown-row breakdown-button" type="button" ${attributeName}="${attributeValue}">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </button>
      `;
    })
    .join("");
}

function renderMetricCards(cards) {
  return `
    <div class="detail-metrics">
      ${cards
        .map(
          (card) => `
            <article class="detail-metric">
              <span>${escapeHtml(card.label)}</span>
              <strong>${escapeHtml(card.value)}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderKeyValueGrid(rows) {
  return `
    <div class="detail-grid">
      ${rows
        .map(
          ([label, value]) => `
            <article class="detail-grid-item">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value || "-")}</strong>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderStaticMovementList(movements, emptyText) {
  if (!movements.length) {
    return `<p class="status">${escapeHtml(emptyText)}</p>`;
  }

  return movements
    .map(
      (movement) => `
        <article class="movement ${escapeHtml(movement.type)}">
          <div class="movement-main">
            <span>${escapeHtml(movement.category)}</span>
            <span>${escapeHtml(money(movement.amount))}</span>
          </div>
          <div class="movement-meta">${escapeHtml(formatDate(movement.date))} - ${escapeHtml(movement.type)} - ${escapeHtml(movement.activity)}</div>
          <div class="movement-meta">${escapeHtml([movement.party, movement.asset, movement.notes].filter(Boolean).join(" - ") || "Sin detalle extra")}</div>
        </article>
      `
    )
    .join("");
}

function renderRecordButtons(records, kind) {
  if (!records.length) {
    return '<p class="status">Todavia no hay registros.</p>';
  }

  return records
    .map((record) => {
      if (kind === "crop") {
        return `
          <button class="movement movement-button" type="button" data-crop-record-id="${escapeHtml(record.id)}">
            <div class="movement-main">
              <span>${escapeHtml(record.parcel)} - ${escapeHtml(record.crop)}</span>
              <span>${escapeHtml(`${formatNumber(record.hectares)} ha`)}</span>
            </div>
            <div class="movement-meta">Campana ${escapeHtml(record.campaign)}${record.sowDate ? ` - siembra ${escapeHtml(record.sowDate)}` : ""}</div>
            <div class="movement-meta">${escapeHtml([record.harvestDate ? `cosecha ${record.harvestDate}` : "", record.production, record.notes].filter(Boolean).join(" - ") || "Sin notas adicionales")}</div>
          </button>
        `;
      }

      return `
        <button class="movement movement-button" type="button" data-livestock-record-id="${escapeHtml(record.id)}">
          <div class="movement-main">
            <span>${escapeHtml(record.ref)} - ${escapeHtml(record.type)}</span>
            <span>${escapeHtml(record.status)}</span>
          </div>
          <div class="movement-meta">${escapeHtml([record.sex, record.birthDate ? `nac. ${record.birthDate}` : "", record.group].filter(Boolean).join(" - ") || "Sin clasificacion extra")}</div>
          <div class="movement-meta">${escapeHtml(record.notes || "Sin notas adicionales")}</div>
        </button>
      `;
    })
    .join("");
}

function getCurrentMonthMovements() {
  const now = new Date();
  return getMovements().filter((movement) => {
    const date = new Date(movement.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });
}

function getCurrentYearMovements() {
  const year = new Date().getFullYear();
  return getMovements().filter((movement) => new Date(movement.date).getFullYear() === year);
}

function sumAmounts(movements) {
  return movements.reduce((sum, movement) => sum + movement.amount, 0);
}

function getFinanceMetricData(metric) {
  const monthlyMovements = getCurrentMonthMovements();
  const yearlyMovements = getCurrentYearMovements();

  const configs = {
    monthIncome: {
      eyebrow: "Resumen mensual",
      title: "Ingresos del mes",
      movements: monthlyMovements.filter((movement) => movement.type === "Ingreso"),
      cards: [{ label: "Ingresos", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Ingreso"))) }]
    },
    monthExpenses: {
      eyebrow: "Resumen mensual",
      title: "Gastos del mes",
      movements: monthlyMovements.filter((movement) => movement.type === "Gasto" || movement.type === "Inversion"),
      cards: [
        { label: "Gastos", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Gasto"))) },
        { label: "Inversiones", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Inversion"))) }
      ]
    },
    monthResult: {
      eyebrow: "Resumen mensual",
      title: "Resultado del mes",
      movements: monthlyMovements,
      cards: [
        { label: "Ingresos", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Ingreso"))) },
        { label: "Gastos", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Gasto"))) },
        { label: "Inversiones", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Inversion"))) },
        { label: "Resultado", value: money(sumAmounts(monthlyMovements.filter((movement) => movement.type === "Ingreso")) - sumAmounts(monthlyMovements.filter((movement) => movement.type === "Gasto")) - sumAmounts(monthlyMovements.filter((movement) => movement.type === "Inversion"))) }
      ]
    },
    yearIncome: {
      eyebrow: "Resumen anual",
      title: "Ingresos del ano",
      movements: yearlyMovements.filter((movement) => movement.type === "Ingreso"),
      cards: [{ label: "Ingresos", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Ingreso"))) }]
    },
    yearExpenses: {
      eyebrow: "Resumen anual",
      title: "Gastos del ano",
      movements: yearlyMovements.filter((movement) => movement.type === "Gasto"),
      cards: [{ label: "Gastos", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Gasto"))) }]
    },
    yearInvestments: {
      eyebrow: "Resumen anual",
      title: "Inversiones del ano",
      movements: yearlyMovements.filter((movement) => movement.type === "Inversion"),
      cards: [{ label: "Inversiones", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Inversion"))) }]
    },
    yearResult: {
      eyebrow: "Resumen anual",
      title: "Resultado del ano",
      movements: yearlyMovements,
      cards: [
        { label: "Ingresos", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Ingreso"))) },
        { label: "Gastos", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Gasto"))) },
        { label: "Inversiones", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Inversion"))) },
        { label: "Resultado", value: money(sumAmounts(yearlyMovements.filter((movement) => movement.type === "Ingreso")) - sumAmounts(yearlyMovements.filter((movement) => movement.type === "Gasto")) - sumAmounts(yearlyMovements.filter((movement) => movement.type === "Inversion"))) }
      ]
    }
  };

  return configs[metric] || configs.yearResult;
}

function getPrimaryNavScreen(view) {
  if (FORM_SCREENS.has(view.screen)) return "Anadir";
  if (view.screen === "Detalle") {
    if (view.detailType.startsWith("crop")) return "Cultivos";
    if (view.detailType.startsWith("livestock")) return "Ganado";
    return "Resumen";
  }
  return TOP_LEVEL_SCREENS.has(view.screen) ? view.screen : "Inicio";
}

function getPanelForView(view) {
  if (view.screen === "Detalle") return "Detalle";
  if (FORM_SCREENS.has(view.screen)) return "Movimiento";
  return TOP_LEVEL_SCREENS.has(view.screen) ? view.screen : "Inicio";
}

function navigateTo(view, options = {}) {
  const normalizedView = normalizeView(view);
  const sameView = viewSignature(normalizedView) === viewSignature(currentView);
  const {
    pushHistory = true,
    replaceHistory = false,
    syncHistory = true
  } = options;

  currentView = normalizedView;

  if (currentView.screen === "Cultivos") {
    setCropFormState(currentView.mode === "edit" ? "edit" : "create", currentView.recordId || null);
  } else if (currentView.screen === "Ganado") {
    setLivestockFormState(currentView.mode === "edit" ? "edit" : "create", currentView.recordId || null);
  }

  renderView();

  if (!syncHistory) return;
  const state = { view: currentView };
  if (replaceHistory || !window.history.state?.view) {
    window.history.replaceState(state, "", "");
    return;
  }
  if (pushHistory && !sameView) {
    window.history.pushState(state, "", "");
    return;
  }
  window.history.replaceState(state, "", "");
}

function goBackInApp() {
  if (viewSignature(currentView) === viewSignature(ROOT_VIEW)) return;
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  navigateTo(ROOT_VIEW, { pushHistory: false, replaceHistory: true });
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

function resetMovementForm() {
  const form = document.querySelector("#movementForm");
  form.reset();
  document.querySelector("#date").valueAsDate = new Date();
  setType(document.querySelector("#type").value);
}

function setCropFormState(mode, recordId = null) {
  cropFormState = { mode, recordId };
}

function setLivestockFormState(mode, recordId = null) {
  livestockFormState = { mode, recordId };
}

function populateCropForm(record) {
  document.querySelector("#cropParcel").value = record?.parcel || "";
  document.querySelector("#cropHectares").value = record?.hectares ?? "";
  document.querySelector("#cropName").value = record?.crop || "";
  document.querySelector("#cropCampaign").value = record?.campaign || "";
  document.querySelector("#cropSowDate").value = record?.sowDate || "";
  document.querySelector("#cropHarvestDate").value = record?.harvestDate || "";
  document.querySelector("#cropProduction").value = record?.production || "";
  document.querySelector("#cropNotes").value = record?.notes || "";
}

function populateLivestockForm(record) {
  document.querySelector("#animalRef").value = record?.ref || "";
  document.querySelector("#animalType").value = record?.type || "Vaca";
  document.querySelector("#animalSex").value = record?.sex || "";
  document.querySelector("#animalBirthDate").value = record?.birthDate || "";
  document.querySelector("#animalGroup").value = record?.group || "";
  document.querySelector("#animalStatus").value = record?.status || "Activo";
  document.querySelector("#animalNotes").value = record?.notes || "";
}

function applyCropFormState() {
  const title = document.querySelector("#cropFormTitle");
  const submit = document.querySelector("#cropSubmitButton");
  const cancel = document.querySelector("#cropCancelEditButton");
  const status = document.querySelector("#cropStatus");
  status.textContent = "";

  if (cropFormState.mode === "edit" && cropFormState.recordId) {
    const record = getCrops().find((crop) => crop.id === cropFormState.recordId);
    if (!record) {
      setCropFormState("create");
      applyCropFormState();
      return;
    }
    title.textContent = "Editar parcela";
    submit.textContent = "Guardar cambios";
    cancel.classList.remove("hidden");
    populateCropForm(record);
    document.querySelector("#cropForm").scrollIntoView({ block: "start", behavior: "smooth" });
    document.querySelector("#cropParcel").focus();
    return;
  }

  title.textContent = "Registrar cultivo";
  submit.textContent = "Guardar parcela";
  cancel.classList.add("hidden");
  document.querySelector("#cropForm").reset();
}

function applyLivestockFormState() {
  const title = document.querySelector("#livestockFormTitle");
  const submit = document.querySelector("#livestockSubmitButton");
  const cancel = document.querySelector("#livestockCancelEditButton");
  const status = document.querySelector("#livestockStatus");
  status.textContent = "";

  if (livestockFormState.mode === "edit" && livestockFormState.recordId) {
    const record = getLivestock().find((animal) => animal.id === livestockFormState.recordId);
    if (!record) {
      setLivestockFormState("create");
      applyLivestockFormState();
      return;
    }
    title.textContent = "Editar animal";
    submit.textContent = "Guardar cambios";
    cancel.classList.remove("hidden");
    populateLivestockForm(record);
    document.querySelector("#livestockForm").scrollIntoView({ block: "start", behavior: "smooth" });
    document.querySelector("#animalRef").focus();
    return;
  }

  title.textContent = "Registrar animal";
  submit.textContent = "Guardar animal";
  cancel.classList.add("hidden");
  document.querySelector("#livestockForm").reset();
}

function updateLivestockSummary() {
  const activeAnimals = getLivestock().filter((animal) => animal.status === "Activo");
  const byType = countBy(activeAnimals, "type");
  const cows = byType.Vaca || 0;
  const bulls = byType.Toro || 0;
  const calves = byType.Ternero || 0;
  const heifers = byType.Novilla || 0;

  document.querySelector("#livestockTotal").textContent = activeAnimals.length;
  document.querySelector("#cowTotal").textContent = cows;
  document.querySelector("#calfTotal").textContent = calves;
  document.querySelector("#livestockTypeSummary").innerHTML = renderClickableBreakdownRows(
    [
      ["Vacas", cows],
      ["Toros", bulls],
      ["Terneros", calves],
      ["Novillas", heifers]
    ],
    "data-livestock-type",
    (label) => label.replace(/s$/, "")
  );

  document.querySelectorAll("[data-livestock-type]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "livestock-type",
        livestockType: button.dataset.livestockType
      });
    });
  });
}

function updateCropSummary() {
  const crops = getCrops();
  const hectares = crops.reduce((sum, crop) => sum + (Number(crop.hectares) || 0), 0);
  const harvested = crops.filter((crop) => crop.harvestDate || crop.production).length;
  const hectaresByCrop = crops.reduce((grouped, crop) => {
    const cropName = crop.crop || "Sin cultivo";
    grouped[cropName] = (grouped[cropName] || 0) + (Number(crop.hectares) || 0);
    return grouped;
  }, {});

  document.querySelector("#cropTotal").textContent = crops.length;
  document.querySelector("#cropHectaresTotal").textContent = formatNumber(hectares);
  document.querySelector("#harvestedTotal").textContent = harvested;
  document.querySelector("#cropTypeSummary").innerHTML = renderClickableBreakdownRows(
    Object.entries(hectaresByCrop)
      .sort((a, b) => b[1] - a[1])
      .map(([cropName, total]) => [cropName, `${formatNumber(total)} ha`]),
    "data-crop-name",
    (label) => label
  );

  document.querySelectorAll("[data-crop-name]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "crop-type",
        cropName: button.dataset.cropName
      });
    });
  });
}

function updateSummary() {
  const movements = getCurrentMonthMovements();
  const income = sumAmounts(movements.filter((movement) => movement.type === "Ingreso"));
  const expenses = sumAmounts(movements.filter((movement) => movement.type === "Gasto"));
  const investments = sumAmounts(movements.filter((movement) => movement.type === "Inversion"));

  document.querySelector("#monthIncome").textContent = money(income);
  document.querySelector("#monthExpenses").textContent = money(expenses + investments);
  document.querySelector("#monthResult").textContent = money(income - expenses - investments);
  updateReport();
}

function syncStatusText(result) {
  if (result.confirmed) return "Guardado en el movil y confirmado en Google Sheets.";
  if (result.attempted) return "Guardado en el movil. Envio intentado; revisa Google Sheets.";
  return "Guardado en el movil. Queda pendiente de sincronizar.";
}

function updateReport() {
  const movements = getCurrentYearMovements();
  const income = sumAmounts(movements.filter((movement) => movement.type === "Ingreso"));
  const expenses = sumAmounts(movements.filter((movement) => movement.type === "Gasto"));
  const investments = sumAmounts(movements.filter((movement) => movement.type === "Inversion"));

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
    ? rows
        .map(
          ([category, total]) => `
            <button class="category-row category-button" type="button" data-category="${escapeHtml(category)}">
              <span>${escapeHtml(category)}</span>
              <strong>${escapeHtml(money(total))}</strong>
            </button>
          `
        )
        .join("")
    : '<p class="status">Todavia no hay datos para resumir.</p>';

  report.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "finance-category",
        category: button.dataset.category
      });
    });
  });

  updateOperationsReport();
}

function updateOperationsReport() {
  const crops = getCrops();
  const hectares = crops.reduce((sum, crop) => sum + (Number(crop.hectares) || 0), 0);
  const hectaresByCrop = crops.reduce((grouped, crop) => {
    const cropName = crop.crop || "Sin cultivo";
    grouped[cropName] = (grouped[cropName] || 0) + (Number(crop.hectares) || 0);
    return grouped;
  }, {});

  const activeAnimals = getLivestock().filter((animal) => animal.status === "Activo");
  const livestockByType = countBy(activeAnimals, "type");

  document.querySelector("#reportCropHectares").textContent = `${formatNumber(hectares)} ha`;
  document.querySelector("#reportCropParcels").textContent = crops.length;
  document.querySelector("#reportCropBreakdown").innerHTML = renderMiniBreakdown(
    Object.entries(hectaresByCrop)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label, value]) => [label, `${formatNumber(value)} ha`])
  );

  document.querySelector("#reportLivestockActive").textContent = activeAnimals.length;
  document.querySelector("#reportLivestockCows").textContent = livestockByType.Vaca || 0;
  document.querySelector("#reportLivestockCalves").textContent = livestockByType.Ternero || 0;
  document.querySelector("#reportLivestockBreakdown").innerHTML = renderMiniBreakdown([
    ["Vacas", livestockByType.Vaca || 0],
    ["Toros", livestockByType.Toro || 0],
    ["Terneros", livestockByType.Ternero || 0],
    ["Novillas", livestockByType.Novilla || 0]
  ]);
}

function updateSyncPanel() {
  const summary = getSyncSummary();
  const pending = document.querySelector("#syncPending");
  if (!pending) return;

  document.querySelector("#syncPending").textContent = summary.pending;
  document.querySelector("#syncErrors").textContent = summary.errors;
  document.querySelector("#syncAttempted").textContent = summary.attempted;

  const latestItems = summary.items.slice(0, 6);
  document.querySelector("#syncList").innerHTML = latestItems.length
    ? latestItems
        .map(
          (item) => `
            <article class="sync-item ${item.status}">
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(syncStatusLabel(item.status))}</span>
              </div>
              <small>${escapeHtml(item.lastMessage || "Pendiente de envio.")}</small>
            </article>
          `
        )
        .join("")
    : '<p class="status">Todavia no hay envios registrados.</p>';
}

function syncStatusLabel(status) {
  if (status === "attempted") return "Intentado";
  if (status === "error") return "Error";
  return "Pendiente";
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
        <span>${escapeHtml(movement.category)}</span>
        <span>${escapeHtml(money(movement.amount))}</span>
      </div>
      <div class="movement-meta">${escapeHtml(formatDate(movement.date))} - ${escapeHtml(movement.type)} - ${escapeHtml(movement.activity)}</div>
      <div class="movement-meta">${escapeHtml([movement.party, movement.asset, movement.notes, movement.attachmentName].filter(Boolean).join(" - ") || "Sin detalle extra")}</div>
    `;
    recentList.append(item);
  });
}

function renderCrops() {
  updateCropSummary();
  const crops = getCrops().slice(0, 10);
  const cropList = document.querySelector("#cropList");
  cropList.innerHTML = renderRecordButtons(crops, "crop");

  cropList.querySelectorAll("[data-crop-record-id]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "crop-record",
        recordId: button.dataset.cropRecordId
      });
    });
  });
}

function renderLivestock() {
  updateLivestockSummary();
  const animals = getLivestock().slice(0, 12);
  const livestockList = document.querySelector("#livestockList");
  livestockList.innerHTML = renderRecordButtons(animals, "livestock");

  livestockList.querySelectorAll("[data-livestock-record-id]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "livestock-record",
        recordId: button.dataset.livestockRecordId
      });
    });
  });
}

function buildDetailState() {
  if (currentView.detailType === "finance-metric") {
    const metric = getFinanceMetricData(currentView.metric);
    return {
      eyebrow: metric.eyebrow,
      title: metric.title,
      summary: renderMetricCards(metric.cards),
      actions: "",
      content: `
        <section class="detail-section">
          <h3>Movimientos relacionados</h3>
          <div class="recent-list">
            ${renderStaticMovementList(metric.movements, "No hay movimientos para este bloque.")}
          </div>
        </section>
      `
    };
  }

  if (currentView.detailType === "finance-category") {
    const categoryMovements = getCurrentYearMovements().filter(
      (movement) => movement.category === currentView.category
    );
    return {
      eyebrow: "Detalle por categoria",
      title: currentView.category,
      summary: renderMetricCards([
        { label: "Movimientos", value: categoryMovements.length },
        { label: "Total", value: money(sumAmounts(categoryMovements)) }
      ]),
      actions: "",
      content: `
        <section class="detail-section">
          <h3>Movimientos de la categoria</h3>
          <div class="recent-list">
            ${renderStaticMovementList(categoryMovements, "No hay movimientos para esta categoria.")}
          </div>
        </section>
      `
    };
  }

  if (currentView.detailType === "crop-overview") {
    const crops = getCrops();
    const hectares = crops.reduce((sum, crop) => sum + (Number(crop.hectares) || 0), 0);
    const breakdown = crops.reduce((grouped, crop) => {
      grouped[crop.crop] = (grouped[crop.crop] || 0) + (Number(crop.hectares) || 0);
      return grouped;
    }, {});

    return {
      eyebrow: "Cultivos",
      title: "Desglose de cultivos",
      summary: renderMetricCards([
        { label: "Parcelas", value: crops.length },
        { label: "Hectareas", value: `${formatNumber(hectares)} ha` },
        { label: "Tipos", value: Object.keys(breakdown).length }
      ]),
      actions: "",
      content: `
        <section class="detail-section">
          <h3>Por cultivo</h3>
          <div class="detail-stack">
            ${renderBreakdownRows(
              Object.entries(breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([label, value]) => [label, `${formatNumber(value)} ha`])
            )}
          </div>
        </section>
        <section class="detail-section">
          <h3>Todas las parcelas</h3>
          <div class="recent-list">
            ${renderRecordButtons(crops, "crop")}
          </div>
        </section>
      `
    };
  }

  if (currentView.detailType === "crop-type") {
    const crops = getCrops().filter((crop) => crop.crop === currentView.cropName);
    const hectares = crops.reduce((sum, crop) => sum + (Number(crop.hectares) || 0), 0);
    return {
      eyebrow: "Cultivos",
      title: currentView.cropName,
      summary: renderMetricCards([
        { label: "Parcelas", value: crops.length },
        { label: "Hectareas", value: `${formatNumber(hectares)} ha` }
      ]),
      actions: "",
      content: `
        <section class="detail-section">
          <h3>Parcelas de este cultivo</h3>
          <div class="recent-list">
            ${renderRecordButtons(crops, "crop")}
          </div>
        </section>
      `
    };
  }

  if (currentView.detailType === "crop-record") {
    const crop = getCrops().find((record) => record.id === currentView.recordId);
    if (!crop) {
      return {
        eyebrow: "Cultivos",
        title: "Parcela no encontrada",
        summary: "",
        actions: "",
        content: '<p class="status">La parcela ya no existe en el movil.</p>'
      };
    }
    return {
      eyebrow: "Detalle de parcela",
      title: `${crop.parcel} - ${crop.crop}`,
      summary: renderMetricCards([
        { label: "Hectareas", value: `${formatNumber(crop.hectares)} ha` },
        { label: "Campana", value: crop.campaign },
        { label: "Produccion", value: crop.production || "-" }
      ]),
      actions: '<button class="secondary" id="detailPrimaryAction" type="button">Editar parcela</button>',
      actionHandler: () => navigateTo({ screen: "Cultivos", mode: "edit", recordId: crop.id }),
      content: renderKeyValueGrid([
        ["Parcela", crop.parcel],
        ["Cultivo", crop.crop],
        ["Hectareas", `${formatNumber(crop.hectares)} ha`],
        ["Campana", crop.campaign],
        ["Siembra", crop.sowDate || "-"],
        ["Cosecha", crop.harvestDate || "-"],
        ["Produccion", crop.production || "-"],
        ["Notas", crop.notes || "-"]
      ])
    };
  }

  if (currentView.detailType === "livestock-overview") {
    const animals = getLivestock();
    const activeAnimals = animals.filter((animal) => animal.status === "Activo");
    const byType = countBy(activeAnimals, "type");
    return {
      eyebrow: "Ganado",
      title: "Desglose de ganado",
      summary: renderMetricCards([
        { label: "Animales", value: animals.length },
        { label: "Activos", value: activeAnimals.length },
        { label: "Tipos", value: Object.keys(byType).length }
      ]),
      actions: "",
      content: `
        <section class="detail-section">
          <h3>Activos por tipo</h3>
          <div class="detail-stack">
            ${renderBreakdownRows(
              Object.entries(byType)
                .sort((a, b) => b[1] - a[1])
                .map(([label, value]) => [label, value])
            )}
          </div>
        </section>
        <section class="detail-section">
          <h3>Ultimos animales</h3>
          <div class="recent-list">
            ${renderRecordButtons(animals, "livestock")}
          </div>
        </section>
      `
    };
  }

  if (currentView.detailType === "livestock-type") {
    const animals = getLivestock().filter((animal) => animal.type === currentView.livestockType);
    const activeAnimals = animals.filter((animal) => animal.status === "Activo");
    return {
      eyebrow: "Ganado",
      title: currentView.livestockType,
      summary: renderMetricCards([
        { label: "Total", value: animals.length },
        { label: "Activos", value: activeAnimals.length }
      ]),
      actions: "",
      content: `
        <section class="detail-section">
          <h3>Animales de este tipo</h3>
          <div class="recent-list">
            ${renderRecordButtons(animals, "livestock")}
          </div>
        </section>
      `
    };
  }

  if (currentView.detailType === "livestock-record") {
    const animal = getLivestock().find((record) => record.id === currentView.recordId);
    if (!animal) {
      return {
        eyebrow: "Ganado",
        title: "Animal no encontrado",
        summary: "",
        actions: "",
        content: '<p class="status">El animal ya no existe en el movil.</p>'
      };
    }
    return {
      eyebrow: "Detalle de animal",
      title: `${animal.ref} - ${animal.type}`,
      summary: renderMetricCards([
        { label: "Estado", value: animal.status },
        { label: "Sexo", value: animal.sex || "-" },
        { label: "Grupo", value: animal.group || "-" }
      ]),
      actions: '<button class="secondary" id="detailPrimaryAction" type="button">Editar animal</button>',
      actionHandler: () => navigateTo({ screen: "Ganado", mode: "edit", recordId: animal.id }),
      content: renderKeyValueGrid([
        ["Referencia", animal.ref],
        ["Tipo", animal.type],
        ["Estado", animal.status],
        ["Sexo", animal.sex || "-"],
        ["Nacimiento", animal.birthDate || "-"],
        ["Madre / lote", animal.group || "-"],
        ["Notas", animal.notes || "-"]
      ])
    };
  }

  return {
    eyebrow: "Detalle",
    title: "Sin datos",
    summary: "",
    actions: "",
    content: '<p class="status">No se ha podido construir este desglose.</p>'
  };
}

function bindDetailContentInteractions() {
  document.querySelectorAll("[data-crop-record-id]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "crop-record",
        recordId: button.dataset.cropRecordId
      });
    });
  });

  document.querySelectorAll("[data-livestock-record-id]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({
        screen: "Detalle",
        detailType: "livestock-record",
        recordId: button.dataset.livestockRecordId
      });
    });
  });
}

function renderDetailView() {
  const detailState = buildDetailState();
  document.querySelector("#detailEyebrow").textContent = detailState.eyebrow;
  document.querySelector("#detailTitle").textContent = detailState.title;
  document.querySelector("#detailSummary").innerHTML = detailState.summary || "";
  document.querySelector("#detailContent").innerHTML = detailState.content || "";

  const actions = document.querySelector("#detailActions");
  if (detailState.actions) {
    actions.classList.remove("hidden");
    actions.innerHTML = detailState.actions;
    if (detailState.actionHandler) {
      document.querySelector("#detailPrimaryAction")?.addEventListener("click", detailState.actionHandler);
    }
  } else {
    actions.classList.add("hidden");
    actions.innerHTML = "";
  }

  bindDetailContentInteractions();
}

function renderView() {
  document.querySelector(".app").scrollTo({ top: 0, behavior: "auto" });

  const activeNavScreen = getPrimaryNavScreen(currentView);
  const activePanel = getPanelForView(currentView);

  document.querySelectorAll(".nav-action").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === activeNavScreen);
  });

  document.querySelectorAll(".screen").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== activePanel);
  });

  if (activePanel === "Resumen") {
    updateSummary();
    renderRecent();
  }

  if (activePanel === "Cultivos") {
    renderCrops();
    applyCropFormState();
  }

  if (activePanel === "Ganado") {
    renderLivestock();
    applyLivestockFormState();
  }

  if (activePanel === "Movimiento") {
    resetMovementForm();
    setType(currentView.screen);
    document.querySelector("#amount").focus();
  }

  if (activePanel === "Detalle") {
    updateSummary();
    renderCrops();
    renderLivestock();
    renderDetailView();
  }
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

function bindNavigationButtons() {
  document.querySelectorAll(".home-action, .nav-action").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo({ screen: button.dataset.screen });
    });
  });

  document.querySelectorAll(".back-button").forEach((button) => {
    button.addEventListener("click", goBackInApp);
  });

  document.querySelector("#monthResultCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "monthResult" });
  });
  document.querySelector("#monthExpensesCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "monthExpenses" });
  });
  document.querySelector("#monthIncomeCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "monthIncome" });
  });
  document.querySelector("#yearResultCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "yearResult" });
  });
  document.querySelector("#yearIncomeCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "yearIncome" });
  });
  document.querySelector("#yearExpensesCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "yearExpenses" });
  });
  document.querySelector("#yearInvestmentsCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "finance-metric", metric: "yearInvestments" });
  });
  document.querySelector("#reportCropsCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "crop-overview" });
  });
  document.querySelector("#reportLivestockCard").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "livestock-overview" });
  });
  document.querySelector("#cropSummaryTotalButton").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "crop-overview" });
  });
  document.querySelector("#cropSummaryHectaresButton").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "crop-overview" });
  });
  document.querySelector("#cropSummaryHarvestedButton").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "crop-overview" });
  });
  document.querySelector("#livestockSummaryTotalButton").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "livestock-overview" });
  });
  document.querySelector("#livestockSummaryCowsButton").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "livestock-type", livestockType: "Vaca" });
  });
  document.querySelector("#livestockSummaryCalvesButton").addEventListener("click", () => {
    navigateTo({ screen: "Detalle", detailType: "livestock-type", livestockType: "Ternero" });
  });
}

function bindEvents() {
  bindNavigationButtons();

  document.querySelector("#exportButton").addEventListener("click", exportCsv);

  document.querySelector("#settingsButton").addEventListener("click", () => {
    updateSyncPanel();
    document.querySelector("#settingsDialog").showModal();
  });

  document.querySelector("#saveSettings").addEventListener("click", () => {
    saveScriptUrl(document.querySelector("#scriptUrl").value);
    document.querySelector("#settingsDialog").close();
  });

  document.querySelector("#retrySync").addEventListener("click", async () => {
    const button = document.querySelector("#retrySync");
    button.disabled = true;
    button.textContent = "Reintentando";
    await retryPendingSync();
    updateSyncPanel();
    button.disabled = false;
    button.textContent = "Reintentar";
  });

  document.querySelector("#cropCancelEditButton").addEventListener("click", () => {
    if (cropFormState.recordId) {
      navigateTo({
        screen: "Detalle",
        detailType: "crop-record",
        recordId: cropFormState.recordId
      });
      return;
    }
    setCropFormState("create");
    applyCropFormState();
  });

  document.querySelector("#livestockCancelEditButton").addEventListener("click", () => {
    if (livestockFormState.recordId) {
      navigateTo({
        screen: "Detalle",
        detailType: "livestock-record",
        recordId: livestockFormState.recordId
      });
      return;
    }
    setLivestockFormState("create");
    applyLivestockFormState();
  });

  document.querySelector("#cropForm").addEventListener("submit", handleCropSubmit);
  document.querySelector("#livestockForm").addEventListener("submit", handleLivestockSubmit);
  document.querySelector("#movementForm").addEventListener("submit", handleMovementSubmit);
}

function replaceRecord(list, record) {
  return list.map((item) => (item.id === record.id ? record : item));
}

async function handleLivestockSubmit(event) {
  event.preventDefault();

  const editing =
    livestockFormState.mode === "edit" &&
    livestockFormState.recordId &&
    getLivestock().find((animal) => animal.id === livestockFormState.recordId);
  const baseAnimal = editing || {};
  const animal = {
    recordKind: "livestock",
    id: editing ? editing.id : crypto.randomUUID(),
    createdAt: editing ? editing.createdAt : new Date().toISOString(),
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

  const nextList = editing
    ? replaceRecord(getLivestock(), { ...baseAnimal, ...animal })
    : [animal, ...getLivestock()];
  saveLivestock(nextList);
  renderLivestock();
  updateSummary();
  livestockStatus.textContent = editing ? "Cambios guardados en el movil." : "Guardado en el movil.";

  const result = await syncRecord(animal);
  livestockStatus.textContent = syncStatusText(result);
  updateSyncPanel();

  if (editing) {
    setLivestockFormState("create");
    navigateTo({
      screen: "Detalle",
      detailType: "livestock-record",
      recordId: animal.id
    });
    return;
  }

  document.querySelector("#livestockForm").reset();
}

async function handleCropSubmit(event) {
  event.preventDefault();

  const editing =
    cropFormState.mode === "edit" &&
    cropFormState.recordId &&
    getCrops().find((crop) => crop.id === cropFormState.recordId);
  const baseCrop = editing || {};
  const crop = {
    recordKind: "crop",
    id: editing ? editing.id : crypto.randomUUID(),
    createdAt: editing ? editing.createdAt : new Date().toISOString(),
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

  const nextList = editing
    ? replaceRecord(getCrops(), { ...baseCrop, ...crop })
    : [crop, ...getCrops()];
  saveCrops(nextList);
  renderCrops();
  updateSummary();
  cropStatus.textContent = editing ? "Cambios guardados en el movil." : "Guardado en el movil.";

  const result = await syncRecord(crop);
  cropStatus.textContent = syncStatusText(result);
  updateSyncPanel();

  if (editing) {
    setCropFormState("create");
    navigateTo({
      screen: "Detalle",
      detailType: "crop-record",
      recordId: crop.id
    });
    return;
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

  const result = await syncRecord(movement);
  statusText.textContent = syncStatusText(result);
  updateSyncPanel();

  resetMovementForm();
}

function bindHistory() {
  window.addEventListener("popstate", (event) => {
    const nextView = event.state?.view || ROOT_VIEW;
    currentView = normalizeView(nextView);
    renderView();
  });
}

function init() {
  renderAppShell();
  document.querySelector("#date").valueAsDate = new Date();
  document.querySelector("#scriptUrl").value = getScriptUrl();
  setType("Ingreso");
  bindEvents();
  bindHistory();
  updateSyncPanel();
  navigateTo(ROOT_VIEW, { pushHistory: false, replaceHistory: true });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js");
  }
}

init();
