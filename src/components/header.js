import { icon } from "./icons.js";

export function renderHeader() {
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">IA</span>
        <span class="brand-name">Iturribero Abereak</span>
      </div>
      <button class="icon-button" id="settingsButton" type="button" aria-label="Ajustes">
        ${icon("cog")}
      </button>
    </header>
  `;
}
