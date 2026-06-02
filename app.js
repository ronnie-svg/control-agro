const categories = {
  Ingreso: [
    "Venta terneros",
    "Venta ganado",
    "Venta cereal",
    "PAC / subvencion",
    "Otros ingresos"
  ],
  Gasto: [
    "Pienso",
    "Gasoleo",
    "Veterinario",
    "Semillas",
    "Abonos",
    "Fitosanitarios",
    "Reparaciones",
    "Seguros",
    "Gestoria",
    "Otros gastos"
  ],
  Inversion: [
    "Maquinaria",
    "Instalaciones",
    "Compra ganado",
    "Mejora finca",
    "Otra inversion"
  ]
};

const storageKey = "control-agro-movements";
const scriptUrlKey = "control-agro-script-url";
const defaultScriptUrl = "https://script.google.com/macros/s/AKfycbz06zQqqae3xaHIXWtFvIemTCqO8zovpckmFi9OHcQlqh6U3fFn6ugG61dk6Hxbxv-X/exec";

const form = document.querySelector("#movementForm");
const typeInput = document.querySelector("#type");
const categorySelect = document.querySelector("#category");
const statusText = document.querySelector("#status");
const recentList = document.querySelector("#recentList");
const scriptUrlInput = document.querySelector("#scriptUrl");
const settingsDialog = document.querySelector("#settingsDialog");
const formTitle = document.querySelector("#formTitle");

document.querySelector("#date").valueAsDate = new Date();
scriptUrlInput.value = localStorage.getItem(scriptUrlKey) || defaultScriptUrl;

function money(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}

function parseAmount(value) {
  return Number(String(value).replace(",", ".").replace(/[^\d.-]/g, ""));
}

function getMovements() {
  return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function saveMovements(movements) {
  localStorage.setItem(storageKey, JSON.stringify(movements));
}

function setType(type) {
  typeInput.value = type;
  formTitle.textContent = `Nuevo ${type.toLowerCase()}`;

  categorySelect.innerHTML = "";
  categories[type].forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
}

function showScreen(screen) {
  document.querySelectorAll(".screen").forEach((panel) => {
    const shouldShow = screen === "Inicio"
      ? panel.dataset.panel === "Inicio"
      : screen === "Resumen"
        ? panel.dataset.panel === "Resumen"
        : panel.dataset.panel === "Movimiento";
    panel.classList.toggle("hidden", !shouldShow);
  });

  if (screen === "Resumen") {
    updateReport();
  }

  if (screen !== "Inicio" && screen !== "Resumen") {
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

function readAttachment() {
  const file = document.querySelector("#attachment").files[0];
  if (!file) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || "application/octet-stream",
      data: String(reader.result).split(",")[1]
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sendToSheet(movement) {
  const scriptUrl = localStorage.getItem(scriptUrlKey);
  const targetUrl = scriptUrl || defaultScriptUrl;
  if (!targetUrl) return false;

  await fetch(targetUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(movement)
  });
  return true;
}

function resetForm() {
  form.reset();
  document.querySelector("#date").valueAsDate = new Date();
  setType(typeInput.value);
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

document.querySelectorAll(".home-action").forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

document.querySelector("#backHome").addEventListener("click", () => showScreen("Inicio"));
document.querySelector("#backHomeFromReport").addEventListener("click", () => showScreen("Inicio"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const amount = parseAmount(document.querySelector("#amount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    statusText.textContent = "Revisa el importe.";
    return;
  }

  const attachment = await readAttachment();
  const movement = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    date: document.querySelector("#date").value,
    type: typeInput.value,
    category: categorySelect.value,
    amount,
    activity: document.querySelector("#activity").value,
    asset: document.querySelector("#asset").value.trim(),
    party: document.querySelector("#party").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
    attachmentName: attachment ? attachment.name : "",
    attachmentType: attachment ? attachment.type : "",
    attachmentData: attachment ? attachment.data : ""
  };

  const localMovement = {
    ...movement,
    attachmentData: ""
  };

  saveMovements([localMovement, ...getMovements()]);
  updateSummary();
  renderRecent();
  statusText.textContent = "Guardado en el movil.";

  try {
    const sent = await sendToSheet(movement);
    if (sent) statusText.textContent = "Guardado en el movil y enviado a Google Sheets.";
  } catch {
    statusText.textContent = "Guardado en el movil. No se pudo enviar a Google Sheets.";
  }

  resetForm();
});

document.querySelector("#settingsButton").addEventListener("click", () => {
  settingsDialog.showModal();
});

document.querySelector("#saveSettings").addEventListener("click", () => {
  localStorage.setItem(scriptUrlKey, scriptUrlInput.value.trim());
  settingsDialog.close();
});

document.querySelector("#exportButton").addEventListener("click", exportCsv);

setType("Ingreso");
updateSummary();
renderRecent();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("service-worker.js");
}
