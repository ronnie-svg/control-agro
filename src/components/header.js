import { icon } from "./icons.js";

export function renderHeader() {
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-logo" aria-hidden="true">
          <img src="Iturriberoabereaklogo.svg" alt="">
        </span>
        <span class="brand-name">Iturribero Abereak</span>
      </div>
      <button class="icon-button" id="settingsButton" type="button" aria-label="Ajustes">
        ${icon("cog")}
      </button>
    </header>
  `;
}
