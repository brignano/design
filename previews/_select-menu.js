// The select menu's script contract (issue 198). Copy it into the product: the
// design system ships the CSS, the product owns the behaviour, as with tabs.
// Finds every .select-menu button and the .menu its popovertarget opens.
(() => {
  const SEL = '[role="menuitemradio"]:not(:disabled)';
  for (const btn of document.querySelectorAll('.select-menu')) {
    const pop = document.getElementById(btn.getAttribute('popovertarget'));
    if (!pop) continue; // a disabled menu has no list
    const items = () => [...pop.querySelectorAll(SEL)];
    const value = btn.querySelector('.select-menu-value');
    const hidden = btn.closest('.field')?.querySelector('input[type="hidden"]');
    let typed = '', clear;

    pop.addEventListener('toggle', (e) => {
      btn.setAttribute('aria-expanded', e.newState === 'open');
      if (e.newState === 'open') (pop.querySelector('[aria-checked="true"]') ?? items()[0])?.focus();
    });

    pop.addEventListener('click', (e) => {
      const item = e.target.closest(SEL);
      if (!item) return;
      for (const i of pop.querySelectorAll('[role="menuitemradio"]')) i.setAttribute('aria-checked', i === item);
      value.textContent = item.querySelector('.menu-item-text')?.firstChild.textContent.trim() ?? item.textContent.trim();
      btn.removeAttribute('data-empty');
      if (hidden) hidden.value = item.dataset.value ?? value.textContent;
      pop.hidePopover(); // focus goes back to the button
      btn.dispatchEvent(new CustomEvent('select-menu:change', { bubbles: true, detail: { value: item.dataset.value } }));
    });

    pop.addEventListener('keydown', (e) => {
      const list = items(), at = list.indexOf(document.activeElement);
      const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 }[e.key];
      if (e.key === 'Tab') return pop.hidePopover();
      if (to !== undefined) { e.preventDefault(); list.at(to % list.length)?.focus(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && e.key !== ' ') { // type to jump
        typed += e.key.toLowerCase(); clearTimeout(clear); clear = setTimeout(() => (typed = ''), 600);
        list.find((i) => i.textContent.trim().toLowerCase().startsWith(typed))?.focus();
      }
    });

    btn.addEventListener('keydown', (e) => { // arrows open it, as a native select does
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); btn.click(); }
    });
  }
})();
