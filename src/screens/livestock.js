export function renderLivestockScreen() {
  return `
    <section class="livestock screen hidden" data-panel="Ganado">
      <div class="screen-header">
        <button class="back-button" id="backHomeFromLivestock" type="button" aria-label="Volver a la pantalla anterior">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Ganado</h2>
      </div>

      <section class="module-summary" aria-label="Resumen de ganado">
        <button class="summary-tile" id="livestockSummaryTotalButton" type="button">
          <span>Activos</span>
          <strong id="livestockTotal">0</strong>
        </button>
        <button class="summary-tile" id="livestockSummaryCowsButton" type="button">
          <span>Vacas</span>
          <strong id="cowTotal">0</strong>
        </button>
        <button class="summary-tile" id="livestockSummaryCalvesButton" type="button">
          <span>Terneros</span>
          <strong id="calfTotal">0</strong>
        </button>
      </section>
      <div id="livestockTypeSummary" class="breakdown-list"></div>

      <form id="livestockForm" class="form">
        <div class="section-title form-section-title">
          <h2 id="livestockFormTitle">Registrar animal</h2>
          <button class="secondary small hidden" id="livestockCancelEditButton" type="button">Cancelar edicion</button>
        </div>

        <label>
          Identificador / crotal
          <input id="animalRef" placeholder="Ej. ES0123456789" required>
        </label>

        <label>
          Tipo
          <select id="animalType" required>
            <option>Vaca</option>
            <option>Ternero</option>
            <option>Toro</option>
            <option>Novilla</option>
            <option>Otro</option>
          </select>
        </label>

        <label>
          Sexo
          <select id="animalSex">
            <option></option>
            <option>Hembra</option>
            <option>Macho</option>
          </select>
        </label>

        <label>
          Fecha de nacimiento
          <input id="animalBirthDate" type="date">
        </label>

        <label>
          Madre / lote
          <input id="animalGroup" placeholder="Ej. madre 2341, lote 2026">
        </label>

        <label>
          Estado
          <select id="animalStatus" required>
            <option>Activo</option>
            <option>Vendido</option>
            <option>Baja</option>
            <option>Trasladado</option>
          </select>
        </label>

        <label>
          Notas
          <textarea id="animalNotes" rows="3" placeholder="Sanidad, cubricion, parto, observaciones"></textarea>
        </label>

        <button class="submit" id="livestockSubmitButton" type="submit">Guardar animal</button>
        <p class="status" id="livestockStatus" role="status"></p>
      </form>

      <div class="section-title crop-title">
        <h2>Ultimos animales</h2>
      </div>
      <div id="livestockList" class="recent-list"></div>
    </section>
  `;
}
