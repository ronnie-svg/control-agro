import { icon } from "../components/icons.js";

const actions = [
  { screen: "Resumen", className: "report-link", iconName: "chart", label: "Resumen" },
  { screen: "Ingreso", className: "income", iconName: "plus", label: "Ingreso" },
  { screen: "Gasto", className: "expense", iconName: "minus", label: "Gasto" },
  { screen: "Inversion", className: "investment", iconName: "tractor", label: "Inversion" },
  { screen: "Cultivos", className: "crops-link", iconName: "leaf", label: "Cultivos" },
  { screen: "Ganado", className: "livestock-link", iconName: "cow", label: "Ganado" }
];

export function renderHomeScreen() {
  return `
    <section class="home-actions screen" data-panel="Inicio" aria-label="Acciones rapidas">
      <div class="home-intro">
        <span></span>
        <strong></strong>
      </div>
      ${actions.map((action) => `
        <button class="home-action ${action.className}" type="button" data-screen="${action.screen}">
          <span class="action-icon">${icon(action.iconName)}</span>
          <span>${action.label}</span>
        </button>
      `).join("")}
    </section>
  `;
}
