// _site.js — the one shared script every preview page loads from <head>.
//
// It owns three things so no page has to:
//   1. the page order (PAGES below; it must match index.html, and
//      `npm run check` fails when it doesn't);
//   2. the saved theme, applied the moment the script runs so there is no flash;
//   3. the small header: a link home, previous / next, and the theme switch.
//
// On index.html, an element marked [data-site-toggle] receives the theme switch
// and nothing else is added. Inside an iframe (a design-tool card) no header is
// added. Plain ES2020, no dependencies, no build.
(() => {
  const PAGES = [
    ['color.html', 'Colour'],
    ['type.html', 'Type'],
    ['elevation.html', 'Elevation'],
    ['buttons.html', 'Buttons & links'],
    ['feedback.html', 'Messages'],
    ['status.html', 'Pills'],
    ['diagram.html', 'Diagram nodes'],
    ['product-page.html', 'Product page'],
    ['product-media.html', 'Product page: video proof'],
  ];

  const root = document.documentElement;
  const script = document.currentScript;

  // ── Theme: applied now, before first paint ────────────────────────────────
  const read = () => {
    try { return localStorage.getItem('theme'); } catch { return null; }
  };
  const write = (value) => {
    try {
      if (value) localStorage.setItem('theme', value);
      else localStorage.removeItem('theme');
    } catch { /* storage blocked: the choice lasts for this page only */ }
  };
  const saved = read();
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;

  // ── Stylesheet, resolved from this script's own URL ───────────────────────
  if (script && script.src) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('_site.css', script.src).href;
    document.head.appendChild(link);
  }

  // ── Theme switch: System → Light → Dark → System ──────────────────────────
  const ORDER = [null, 'light', 'dark'];
  const LABEL = { null: 'System', light: 'Light', dark: 'Dark' };
  function themeSwitch() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-theme';
    const show = () => {
      const current = root.dataset.theme === 'light' || root.dataset.theme === 'dark' ? root.dataset.theme : null;
      button.textContent = `Theme: ${LABEL[current]}`;
    };
    button.addEventListener('click', () => {
      const current = root.dataset.theme === 'light' || root.dataset.theme === 'dark' ? root.dataset.theme : null;
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      if (next) root.dataset.theme = next;
      else delete root.dataset.theme;
      write(next);
      show();
    });
    show();
    return button;
  }

  // ── Header ────────────────────────────────────────────────────────────────
  function link(href, text, label) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    if (label) a.setAttribute('aria-label', label);
    return a;
  }

  function mount() {
    const slot = document.querySelector('[data-site-toggle]');
    if (slot) {
      slot.appendChild(themeSwitch());
      return;
    }
    if (window.self !== window.top) return;

    const file = location.pathname.split('/').pop().replace(/\.html$/, '');
    const at = PAGES.findIndex(([f]) => f.replace(/\.html$/, '') === file);

    const header = document.createElement('header');
    header.className = 'site-bar';

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Design system pages');
    nav.appendChild(link('../index.html', '@brignano/design'));
    if (at > 0) {
      const [f, title] = PAGES[at - 1];
      nav.appendChild(link(f, `← ${title}`, `Previous: ${title}`));
    }
    if (at >= 0 && at < PAGES.length - 1) {
      const [f, title] = PAGES[at + 1];
      nav.appendChild(link(f, `${title} →`, `Next: ${title}`));
    }
    nav.appendChild(themeSwitch());
    header.appendChild(nav);
    document.body.prepend(header);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
