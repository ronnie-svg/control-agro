export function renderReportScreen() {
  return `
    <section class="summary screen hidden" data-panel="Resumen" aria-label="Resumen mensual">
      <button class="summary-card summary-primary" id="monthResultCard" type="button">
        <span>Este mes</span>
        <strong id="monthResult">0,00 EUR</strong>
      </button>
      <button class="summary-card" id="monthExpensesCard" type="button">
        <span>Gastos</span>
        <strong id="monthExpenses">0,00 EUR</strong>
      </button>
      <button class="summary-card" id="monthIncomeCard" type="button">
        <span>Ingresos</span>
        <strong id="monthIncome">0,00 EUR</strong>
      </button>
    </section>

    <section class="report screen hidden" data-panel="Resumen">
      <div class="screen-header">
        <button class="back-button" id="backHomeFromReport" type="button" aria-label="Volver a la pantalla anterior">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <h2>Resumen</h2>
      </div>
      <div class="report-grid">
        <button class="report-card" id="yearResultCard" type="button">
          <span>Resultado del ano</span>
          <strong id="yearResult">0,00 EUR</strong>
        </button>
        <button class="report-card" id="yearIncomeCard" type="button">
          <span>Ingresos del ano</span>
          <strong id="yearIncome">0,00 EUR</strong>
        </button>
        <button class="report-card" id="yearExpensesCard" type="button">
          <span>Gastos del ano</span>
          <strong id="yearExpenses">0,00 EUR</strong>
        </button>
        <button class="report-card" id="yearInvestmentsCard" type="button">
          <span>Inversiones del ano</span>
          <strong id="yearInvestments">0,00 EUR</strong>
        </button>
      </div>
      <h2>Por categoria</h2>
      <div id="categoryReport" class="category-report"></div>
      <h2>Campo y ganado</h2>
      <div class="operations-summary">
        <button class="operations-card" id="reportCropsCard" type="button">
          <span>Cultivos</span>
          <strong id="reportCropHectares">0 ha</strong>
          <small><b id="reportCropParcels">0</b> parcelas registradas</small>
          <div id="reportCropBreakdown" class="mini-breakdown"></div>
        </button>
        <button class="operations-card" id="reportLivestockCard" type="button">
          <span>Ganado activo</span>
          <strong id="reportLivestockActive">0</strong>
          <small><b id="reportLivestockCows">0</b> vacas y <b id="reportLivestockCalves">0</b> terneros</small>
          <div id="reportLivestockBreakdown" class="mini-breakdown"></div>
        </button>
      </div>
      <div class="section-title">
        <h2>Ultimos movimientos</h2>
        <button id="exportButton" type="button">Exportar CSV</button>
      </div>
      <div id="recentList" class="recent-list"></div>
    </section>
  `;
}
