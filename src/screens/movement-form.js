export function renderMovementFormScreen() {
  return `
    <form id="movementForm" class="form screen hidden" data-panel="Movimiento">
      <div class="screen-header form-header">
        <button class="back-button" id="backHome" type="button" aria-label="Volver al inicio">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2 id="formTitle">Nuevo ingreso</h2>
      </div>
      <input type="hidden" id="type" value="Ingreso">

      <label>
        Importe
        <div class="money-field">
          <input id="amount" name="amount" inputmode="decimal" placeholder="0,00" required>
          <span>EUR</span>
        </div>
      </label>

      <label>
        Categoria
        <select id="category" name="category" required></select>
      </label>

      <label>
        Fecha
        <input id="date" name="date" type="date" required>
      </label>

      <label>
        Actividad
        <select id="activity" name="activity" required>
          <option>Agricultura</option>
          <option>Ganaderia</option>
          <option>Comun</option>
        </select>
      </label>

      <label>
        Parcela / animal / lote
        <input id="asset" name="asset" placeholder="Ej. Parcela 3, lote terneros">
      </label>

      <label>
        Proveedor o cliente
        <input id="party" name="party" placeholder="Ej. cooperativa, veterinario">
      </label>

      <label>
        Nota rapida
        <textarea id="notes" name="notes" rows="3" placeholder="Factura, concepto, detalle importante"></textarea>
      </label>

      <label>
        Foto o archivo
        <input id="attachment" name="attachment" type="file" accept="image/*,.pdf">
      </label>

      <button class="submit" type="submit">Guardar</button>
      <p class="status" id="status" role="status"></p>
    </form>
  `;
}
