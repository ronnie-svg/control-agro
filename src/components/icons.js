export function renderIconSprite() {
  return `
    <svg class="icon-sprite" aria-hidden="true">
      <symbol id="icon-home" viewBox="0 0 24 24">
        <path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"/>
      </symbol>
      <symbol id="icon-chart" viewBox="0 0 24 24">
        <path d="M4 19h17M7 16V9m5 7V5m5 11v-4"/>
      </symbol>
      <symbol id="icon-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14"/>
      </symbol>
      <symbol id="icon-minus" viewBox="0 0 24 24">
        <path d="M5 12h14"/>
      </symbol>
      <symbol id="icon-tractor" viewBox="0 0 24 24">
        <path d="M4 17a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm11.5.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"/>
        <path d="M10 17h5.5M7 14h8l-2-7H8v7Zm5-7h3l2 5h2"/>
      </symbol>
      <symbol id="icon-leaf" viewBox="0 0 24 24">
        <path d="M5 19c8 0 14-6 14-14C11 5 5 11 5 19Z"/>
        <path d="M5 19c3-5 7-8 14-14"/>
      </symbol>
      <symbol id="icon-cog" viewBox="0 0 24 24">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>
        <path d="M19.4 15a8 8 0 0 0 .1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1L15 6.5h-4l-.4 2.5a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2.2-1.5Z"/>
      </symbol>
      <symbol id="icon-arrow-left" viewBox="0 0 24 24">
        <path d="M19 12H5"/>
        <path d="m12 19-7-7 7-7"/>
      </symbol>
      <symbol id="icon-cow" viewBox="0 0 24 24">
        <path d="M6 8c-2 0-3-2-3-4 3 0 4 2 4 4"/>
        <path d="M18 8c2 0 3-2 3-4-3 0-4 2-4 4"/>
        <path d="M5 11c0-3 2.5-5 7-5s7 2 7 5v4c0 3-2.5 5-7 5s-7-2-7-5v-4Z"/>
        <path d="M9 12h.01M15 12h.01"/>
        <path d="M10 16h4"/>
      </symbol>
    </svg>
  `;
}

export function icon(name) {
  return `<svg><use href="#icon-${name}"></use></svg>`;
}
