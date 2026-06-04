export function renderReportScreen() {
  return `
    <section class="summary screen hidden" data-panel="Resumen" aria-label="Resumen mensual">
      <div class="summary-primary">
        <span>Este mes</span>
        <strong id="monthResult">0,00 EUR</strong>
      </div>
      <div>
        <span>Gastos</span>
        <strong id="monthExpenses">0,00 EUR</strong>
      </div>
      <div>
        <span>Ingresos</span>
        <strong id="monthIncome">0,00 EUR</strong>
      </div>
    </section>

    <section class="report screen hidden" data-panel="Resumen">
      <div class="screen-header">
        <button class="back-button" id="backHomeFromReport" type="button" aria-label="Volver al inicio">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Resumen</h2>
      </div>
      <div class="report-grid">
        <div>
          <span>Resultado del año</span>
          <strong id="yearResult">0,00 EUR</strong>
        </div>
        <div>
          <span>Ingresos del año</span>
          <strong id="yearIncome">0,00 EUR</strong>
        </div>
        <div>
          <span>Gastos del año</span>
          <strong id="yearExpenses">0,00 EUR</strong>
        </div>
        <div>
          <span>Inversiones del año</span>
          <strong id="yearInvestments">0,00 EUR</strong>
        </div>
      </div>
      <h2>Por categoría</h2>
      <div id="categoryReport" class="category-report"></div>
      <h2>Campo y ganado</h2>
      <div class="operations-summary">
        <article>
          <span>Cultivos</span>
          <strong id="reportCropHectares">0 ha</strong>
          <small><b id="reportCropParcels">0</b> parcelas registradas</small>
          <div id="reportCropBreakdown" class="mini-breakdown"></div>
        </article>
        <article>
          <span>Ganado activo</span>
          <strong id="reportLivestockActive">0</strong>
          <small><b id="reportLivestockCows">0</b> vacas y <b id="reportLivestockCalves">0</b> terneros</small>
          <div id="reportLivestockBreakdown" class="mini-breakdown"></div>
        </article>
      </div>
      <div class="section-title">
        <h2>Últimos movimientos</h2>
        <button id="exportButton" type="button">Exportar CSV</button>
      </div>
      <div id="recentList" class="recent-list"></div>
    </section>
  `;
}
