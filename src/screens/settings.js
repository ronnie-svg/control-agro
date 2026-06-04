export function renderSettingsDialog() {
  return `
    <dialog id="settingsDialog">
      <form method="dialog" class="settings">
        <h2>Ajustes</h2>
        <label>
          URL de Apps Script
          <input id="scriptUrl" placeholder="https://script.google.com/macros/s/.../exec">
        </label>
        <p>Si esta vacio, los datos se guardan solo en este movil para probar la app.</p>
        <div class="dialog-actions">
          <button value="cancel" type="submit">Cerrar</button>
          <button id="saveSettings" value="default" type="button">Guardar</button>
        </div>
      </form>
    </dialog>
  `;
}
