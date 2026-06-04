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
          <span>Resultado del ano</span>
          <strong id="yearResult">0,00 EUR</strong>
        </div>
        <div>
          <span>Ingresos del ano</span>
          <strong id="yearIncome">0,00 EUR</strong>
        </div>
        <div>
          <span>Gastos del ano</span>
          <strong id="yearExpenses">0,00 EUR</strong>
        </div>
        <div>
          <span>Inversiones del ano</span>
          <strong id="yearInvestments">0,00 EUR</strong>
        </div>
      </div>
      <h2>Por categoria</h2>
      <div id="categoryReport" class="category-report"></div>
      <div class="section-title">
        <h2>Ultimos movimientos</h2>
        <button id="exportButton" type="button">Exportar CSV</button>
      </div>
      <div id="recentList" class="recent-list"></div>
    </section>
  `;
}
