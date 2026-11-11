/* BAE: shell de presentación. No clona controles del motor ni el Canvas. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  const panel = main?.querySelector(':scope > .editor-panel');
  const preview = main?.querySelector(':scope > .preview');
  const $ = id => document.getElementById(id);
  if (!main || !panel || !preview || !window.BAEEditor) return;
  panel.id = 'baeEditorPanel';
  preview.id = 'baePreviewPanel';
  const small = matchMedia('(max-width:700px)');

  [...panel.querySelectorAll(':scope > section.panel-group')].forEach((section, i) => {
    const title = i === 0 ? 'Variantes' : section.querySelector(':scope > h2')?.textContent?.trim() || 'Controles';
    const body = document.createElement('div');
    body.id = 'bae-card-body-' + i;
    body.className = 'bae-card-body';
    while (section.firstChild) body.append(section.firstChild);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'bae-card-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-controls', body.id);
    const chevron = document.createElement('span');
    chevron.className = 'material-icons';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = 'expand_less';
    toggle.append(document.createTextNode(title), chevron);
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      body.hidden = !expanded;
    });
    section.classList.add('bae-card');
    section.append(toggle, body);
  });

  // Valor fuente: la versión que consume editor.js. Mayúsculas no altera el input.
  const upper = document.createElement('button');
  upper.type = 'button'; upper.id = 'baeUppercase';
  upper.setAttribute('aria-label', 'Mostrar texto en mayúsculas');
  upper.setAttribute('aria-pressed', 'false');
  upper.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">match_case</span>';
  $('formatClear')?.parentElement?.insertBefore(upper, $('formatClear'));
  upper.addEventListener('click', () => {
    const active = upper.getAttribute('aria-pressed') !== 'true';
    upper.setAttribute('aria-pressed', String(active));
    window.BAEEditor.setUppercase(active);
  });

  const nav = document.createElement('nav');
  nav.className = 'bae-mobile-tabs';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Secciones de BAE');
  const tabs = [['preview', 'Vista previa', preview], ['format', 'Formato', panel]].map(([key, name, target]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', target.id);
    nav.append(button);
    return { key, button, target };
  });
  main.prepend(nav);
  let activeTab = 'preview';
  function selectTab(key, focus = false) {
    activeTab = key;
    main.dataset.baeMobileTab = key;
    for (const tab of tabs) {
      const selected = tab.key === key;
      tab.button.setAttribute('aria-selected', String(selected));
      tab.button.tabIndex = selected ? 0 : -1;
      tab.target.inert = small.matches && !selected;
    }
    if (focus) tabs.find(t => t.key === key)?.button.focus();
    requestAnimationFrame(() => dispatchEvent(new Event('resize')));
  }
  for (const tab of tabs) tab.button.addEventListener('click', () => selectTab(tab.key));
  nav.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    selectTab(event.key === 'Home' ? 'preview' : event.key === 'End' ? 'format' : activeTab === 'preview' ? 'format' : 'preview', true);
  });
  small.addEventListener('change', () => selectTab(activeTab));

  // Editor breve de preview: comandos enviados al campo original, sin estado gráfico.
  const mobile = document.createElement('section');
  mobile.className = 'bae-preview-text-editor';
  mobile.setAttribute('aria-label', 'Editar textos desde vista previa');
  mobile.innerHTML = '<h2>Editar textos</h2><label for="baeHeadlineMobile">Texto principal</label><textarea id="baeHeadlineMobile"></textarea><label for="baeSizeMobile">Tamaño de tipografía: <output id="baeSizeMobileLabel">70</output> px</label><input type="range" id="baeSizeMobile" min="42" max="105"><label class="bae-mobile-quote-label"><input type="checkbox" id="baeQuoteEnabledMobile"> Incluir textual</label><textarea id="baeQuoteMobile" aria-label="Textual" placeholder="Escribí el textual"></textarea><div class="bae-mobile-format" role="group" aria-label="Formato del texto"><button type="button" data-mark="*" aria-label="Destacar selección">Destacar</button><button type="button" data-mark="_" aria-label="Aplicar cursiva">Cursiva</button><button type="button" data-mark="~" aria-label="Tachar selección">Tachar</button><button type="button" data-align="left" aria-label="Alinear a la izquierda">Izquierda</button><button type="button" data-align="center" aria-label="Alinear al centro">Centro</button><button type="button" data-action="uppercase" aria-label="Mostrar texto en mayúsculas desde la vista previa" aria-pressed="false">Mayúsculas</button><button type="button" data-action="clear" aria-label="Quitar formato de la selección desde la vista previa">Limpiar formato</button></div>';
  preview.insertBefore(mobile, preview.querySelector('.preview-actions'));
  const headline = $('baeHeadlineMobile'), size = $('baeSizeMobile');
  const quote = $('baeQuoteMobile'), enabled = $('baeQuoteEnabledMobile');
  function notify(id, value, type = 'input') {
    const input = $(id);
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value;
    input.dispatchEvent(new Event(type, { bubbles: true }));
  }
  function sync() {
    for (const [left, right] of [[headline, $('headline')], [size, $('size')], [quote, $('quote')]]) {
      if (document.activeElement !== left && left.value !== right.value) left.value = right.value;
    }
    enabled.checked = $('enableQuote').checked;
    quote.hidden = !enabled.checked;
    $('baeSizeMobileLabel').textContent = size.value;
    headline.classList.toggle('uppercase-preview', upper.getAttribute('aria-pressed') === 'true');
    const mobileUpper = mobile.querySelector('[data-action="uppercase"]');
    mobileUpper?.setAttribute('aria-pressed', upper.getAttribute('aria-pressed'));
    for (const button of mobile.querySelectorAll('[data-align]')) {
      const source = $('align' + (button.dataset.align === 'left' ? 'Left' : 'Center'));
      button.setAttribute('aria-pressed', source.getAttribute('aria-pressed'));
    }
  }
  headline.addEventListener('input', () => notify('headline', headline.value));
  size.addEventListener('input', () => notify('size', size.value));
  quote.addEventListener('input', () => notify('quote', quote.value));
  enabled.addEventListener('change', () => notify('enableQuote', enabled.checked, 'change'));
  for (const button of mobile.querySelectorAll('[data-mark]')) {
    button.addEventListener('pointerdown', e => e.preventDefault());
    button.addEventListener('click', () => {
      const a = headline.selectionStart, b = headline.selectionEnd;
      if (a === b) { headline.focus(); return; }
      const mark = button.dataset.mark;
      headline.setRangeText(mark + headline.value.slice(a, b) + mark, a, b, 'select');
      notify('headline', headline.value);
      headline.focus({ preventScroll: true });
    });
  }
  for (const button of mobile.querySelectorAll('[data-align]')) {
    button.addEventListener('click', () => { $('align' + (button.dataset.align === 'left' ? 'Left' : 'Center')).click(); sync(); });
  }
  mobile.querySelector('[data-action="uppercase"]')?.addEventListener('click', () => {
    upper.click(); // El estado canónico permanece en BAEEditor.
    sync();
  });
  mobile.querySelector('[data-action="clear"]')?.addEventListener('pointerdown', event => event.preventDefault());
  mobile.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    const a = headline.selectionStart, b = headline.selectionEnd;
    if (a === b) { headline.focus(); return; }
    const cleaned = headline.value.slice(a, b).replace(/[\\*_~]/g, '');
    headline.setRangeText(cleaned, a, b, 'select');
    notify('headline', headline.value);
    headline.focus({ preventScroll: true });
  });
  addEventListener('editorial:bae:render', sync);
  for (const id of ['headline','quote','size','enableQuote']) {
    $(id).addEventListener('input', sync);
    $(id).addEventListener('change', sync);
  }
  sync();

  const hit = document.createElement('button');
  hit.type = 'button';
  hit.className = 'bae-text-hit';
  hit.setAttribute('aria-label','Editar texto principal desde la placa');
  // Paridad con el área táctil de Andy: scroll ≠ abrir editor.
  // Los clics sin pointer (Enter/Espacio) siguen siendo accesibles.
  let gesture = null, allowPointerClick = false;
  hit.addEventListener('pointerdown', event => {
    if (!event.isPrimary) return;
    gesture = { id:event.pointerId, x:event.clientX, y:event.clientY, started:performance.now() };
    allowPointerClick = false;
  });
  hit.addEventListener('pointermove', event => {
    if (gesture?.id === event.pointerId &&
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 9) {
      gesture = null; allowPointerClick = false;
    }
  });
  hit.addEventListener('pointerup', event => {
    allowPointerClick = Boolean(gesture?.id === event.pointerId &&
      Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 9 &&
      performance.now() - gesture.started < 550);
    gesture = null;
  });
  hit.addEventListener('pointercancel', () => { gesture = null; allowPointerClick = false; });
  hit.addEventListener('click', event => {
    if (event.detail !== 0 && !allowPointerClick) return;
    allowPointerClick = false;
    headline.focus({ preventScroll:true });
    headline.scrollIntoView({ block:'center', behavior:'smooth' });
  });
  $('photoStage').append(hit);

  function progress(input) {
    const min = Number(input.min), max = Number(input.max);
    input.style.setProperty('--mobile-progress', (100 * (Number(input.value) - min) / (max - min)) + '%');
  }
  const sliders = ['size','dots','photoZoom','baeSizeMobile'].map($);
  for (const input of sliders) { input.addEventListener('input', () => progress(input)); progress(input); }
  addEventListener('editorial:bae:render', () => sliders.forEach(progress));
  main.classList.add('bae-mobile-ready');
  selectTab('preview');
})();
