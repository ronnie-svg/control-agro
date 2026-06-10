export function renderDetailScreen() {
  return `
    <section class="detail screen hidden" data-panel="Detalle">
      <div class="screen-header detail-screen-header">
        <button class="back-button" id="detailBackButton" type="button" aria-label="Volver a la pantalla anterior">
          <svg><use href="#icon-arrow-left"></use></svg>
        </button>
        <div class="detail-heading">
          <span id="detailEyebrow" class="detail-eyebrow"></span>
          <h2 id="detailTitle">Detalle</h2>
        </div>
      </div>

      <div id="detailSummary" class="detail-summary"></div>
      <div id="detailActions" class="detail-actions hidden"></div>
      <div id="detailContent" class="detail-content"></div>
    </section>
  `;
}
