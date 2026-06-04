import { icon } from "./icons.js";

export function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="Navegacion principal">
      <button class="nav-action active" type="button" data-screen="Inicio">
        ${icon("home")}
        <span>Inicio</span>
      </button>
      <button class="nav-action" type="button" data-screen="Resumen">
        ${icon("chart")}
        <span>Resumen</span>
      </button>
      <button class="nav-action" type="button" data-screen="Anadir">
        ${icon("plus")}
        <span>Anadir</span>
      </button>
      <button class="nav-action" type="button" data-screen="Cultivos">
        ${icon("leaf")}
        <span>Cultivos</span>
      </button>
      <button class="nav-action" type="button" data-screen="Ganado">
        ${icon("cow")}
        <span>Ganado</span>
      </button>
    </nav>
  `;
}
