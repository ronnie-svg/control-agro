export function money(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}

export function parseAmount(value) {
  return Number(String(value).replace(",", ".").replace(/[^\d.-]/g, ""));
}
