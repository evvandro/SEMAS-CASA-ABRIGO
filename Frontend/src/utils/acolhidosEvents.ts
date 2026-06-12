export const ACOLHIDOS_COUNT_REFRESH_EVENT = 'acolhidos-count-refresh';

export function notifyAcolhidosCountRefresh() {
  window.dispatchEvent(new CustomEvent(ACOLHIDOS_COUNT_REFRESH_EVENT));
}
