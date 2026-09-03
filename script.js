document.documentElement.classList.add('js');

const menuButton = document.querySelector('[data-menu-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');

const setMenuState = (isOpen) => {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  mobileMenu.hidden = !isOpen;
  document.body.classList.toggle('menu-open', isOpen);
};

menuButton?.addEventListener('click', () => {
  setMenuState(menuButton.getAttribute('aria-expanded') !== 'true');
});

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenuState(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuState(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 850) setMenuState(false);
});

const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  },
  { rootMargin: '-25% 0px -58% 0px', threshold: [0, 0.1, 0.35] }
);

sections.forEach((section) => sectionObserver.observe(section));

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
);

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelector('[data-current-year]').textContent = new Date().getFullYear();

/* Photo carousel behavior: prev/next buttons, snap scrolling, keyboard support */
(() => {
  // support multiple carousels if present
  const carousels = document.querySelectorAll('.photo-carousel');
  carousels.forEach((carousel) => {
    const viewport = carousel.querySelector('.carousel-viewport');
    if (!viewport) return;

    const prev = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');
    const track = viewport.querySelector('.carousel-track');

    const getScrollAmount = () => {
      // prefer CSS variable --slide, fallback to first slide width
      const css = getComputedStyle(track).getPropertyValue('--slide');
      if (css) {
        const val = parseFloat(css);
        if (!Number.isNaN(val)) return Math.round(val +  parseFloat(getComputedStyle(track).gap || 16));
      }
      const slide = track.querySelector('.carousel-slide');
      if (!slide) return Math.round(viewport.clientWidth * 0.8);
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.gap || 16) || 16;
      return Math.round(slide.getBoundingClientRect().width + gap);
    };

    prev?.addEventListener('click', () => viewport.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
    next?.addEventListener('click', () => viewport.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));

    // keyboard: left/right when focused
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); viewport.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }); }
      if (e.key === 'ArrowRight') { e.preventDefault(); viewport.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }); }
    });

    // pointer drag support for a smoother swipe feel
    let isDown = false; let startX = 0; let scrollLeft = 0;
    viewport.addEventListener('pointerdown', (e) => { isDown = true; try { viewport.setPointerCapture(e.pointerId); } catch {} startX = e.clientX; scrollLeft = viewport.scrollLeft; });
    viewport.addEventListener('pointermove', (e) => { if (!isDown) return; const dx = startX - e.clientX; viewport.scrollLeft = scrollLeft + dx; });
    const endDrag = (e) => { if (!isDown) return; isDown = false; try { viewport.releasePointerCapture(e.pointerId); } catch {} };
    viewport.addEventListener('pointerup', endDrag); viewport.addEventListener('pointercancel', endDrag);
  });
})();
