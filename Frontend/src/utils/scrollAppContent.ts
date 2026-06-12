export function scrollAppContentToTop() {
  if (typeof document === 'undefined') return;

  const scroller = document.scrollingElement ?? document.documentElement;
  scroller.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth',
  });
}
