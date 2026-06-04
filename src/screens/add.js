import { icon } from "../components/icons.js";

const addOptions = [
  { screen: "Ingreso", className: "income", iconName: "plus", label: "Ingreso" },
  { screen: "Gasto", className: "expense", iconName: "minus", label: "Gasto" },
  { screen: "Inversion", className: "investment", iconName: "tractor", label: "Inversion" },
  { screen: "Cultivos", className: "crops-link", iconName: "leaf", label: "Parcela" },
  { screen: "Ganado", className: "livestock-link", iconName: "cow", label: "Animal" }
];

export function renderAddScreen() {
  return `
    <section class="add-screen screen hidden" data-panel="Anadir">
      <div class="screen-header">
        <button class="back-button" id="backHomeFromAdd" type="button" aria-label="Volver al inicio">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Anadir</h2>
      </div>

      <div class="screen-intro">
        <span>Nuevo registro</span>
        <strong>Elige que quieres anadir</strong>
      </div>

      <div class="add-options" aria-label="Elegir que anadir">
        ${addOptions.map((option) => `
          <button class="home-action ${option.className}" type="button" data-screen="${option.screen}">
            <span class="action-icon">${icon(option.iconName)}</span>
            <span>${option.label}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}
