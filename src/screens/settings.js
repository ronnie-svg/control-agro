export function renderSettingsDialog() {
  return `
    <dialog id="settingsDialog">
      <form method="dialog" class="settings">
        <h2>Ajustes</h2>
        <label>
          URL de Apps Script
          <input id="scriptUrl" placeholder="https://script.google.com/macros/s/.../exec">
        </label>
        <p>Los datos se guardan primero en este movil. El envio a Google Sheets queda registrado aqui.</p>
        <section class="sync-panel" aria-label="Estado de sincronizacion">
          <div>
            <span>Pendientes</span>
            <strong id="syncPending">0</strong>
          </div>
          <div>
            <span>Errores</span>
            <strong id="syncErrors">0</strong>
          </div>
          <div>
            <span>Intentados</span>
            <strong id="syncAttempted">0</strong>
          </div>
        </section>
        <div id="syncList" class="sync-list"></div>
        <div class="dialog-actions">
          <button id="retrySync" type="button">Reintentar</button>
          <button value="cancel" type="submit">Cerrar</button>
          <button id="saveSettings" value="default" type="button">Guardar</button>
        </div>
      </form>
    </dialog>
  `;
}
