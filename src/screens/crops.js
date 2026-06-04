export function renderCropsScreen() {
  return `
    <section class="crops screen hidden" data-panel="Cultivos">
      <div class="screen-header">
        <button class="back-button" id="backHomeFromCrops" type="button" aria-label="Volver al inicio">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Parcelas y cultivos</h2>
      </div>

      <section class="module-summary" aria-label="Resumen de cultivos">
        <div>
          <span>Parcelas</span>
          <strong id="cropTotal">0</strong>
        </div>
        <div>
          <span>Total ha</span>
          <strong id="cropHectaresTotal">0</strong>
        </div>
        <div>
          <span>Cosechadas</span>
          <strong id="harvestedTotal">0</strong>
        </div>
      </section>
      <div id="cropTypeSummary" class="breakdown-list"></div>

      <form id="cropForm" class="form">
        <h2>Registrar cultivo</h2>
        <label>
          Parcela
          <input id="cropParcel" placeholder="Ej. Parcela 3" required>
        </label>

        <label>
          Extensión del terreno (ha)
          <input id="cropHectares" inputmode="decimal" placeholder="Ej. 12,5" required>
        </label>

        <label>
          Cultivo sembrado
          <input id="cropName" placeholder="Ej. trigo, cebada, maíz" required>
        </label>

        <label>
          Campaña
          <input id="cropCampaign" placeholder="Ej. 2026" required>
        </label>

        <label>
          Fecha de siembra
          <input id="cropSowDate" type="date">
        </label>

        <label>
          Fecha de cosecha
          <input id="cropHarvestDate" type="date">
        </label>

        <label>
          Producción cosechada
          <input id="cropProduction" inputmode="decimal" placeholder="Ej. 48500 kg">
        </label>

        <label>
          Notas
          <textarea id="cropNotes" rows="3" placeholder="Humedad, variedad, incidencias, destino"></textarea>
        </label>

        <button class="submit" type="submit">Guardar parcela</button>
        <p class="status" id="cropStatus" role="status"></p>
      </form>

      <div class="section-title crop-title">
        <h2>Últimas parcelas</h2>
      </div>
      <div id="cropList" class="recent-list"></div>
    </section>
  `;
}
