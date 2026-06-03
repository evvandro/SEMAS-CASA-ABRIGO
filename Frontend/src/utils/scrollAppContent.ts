export function scrollAppContentToTop() {
  setTimeout(() => {
    // Tenta encontrar um Drawer ativo com scroll
    const drawerContainer = document.querySelector<HTMLElement>('[data-drawer-scroll-area]')
    if (drawerContainer) {
      drawerContainer.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Scrola o contêiner interno principal caso seja o layout
    const container = document.querySelector<HTMLElement>('[data-app-scroll-area]')
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    // Fallback: scrola a window
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}