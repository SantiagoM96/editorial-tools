/* Guía contextual accesible de Diario Show. No modifica Canvas ni el motor editorial. */
(() => {
  'use strict';
  const mq = window.matchMedia('(min-width: 701px)');
  const query = new URLSearchParams(location.search);
  if (query.get('onboarding') === 'off') return;
  const storageKey = 'diarioshow-tour-desktop-v1';
  const steps = [
    { selector: '.editor-panel > .panel-group:nth-of-type(1)', title: 'Elegí el diseño de tu placa', description: 'Seleccioná la variante editorial que mejor acompañe la noticia.' },
    { selector: '.editor-panel .logo-control-field', title: 'Elegí el logo', description: 'Cambiá la versión del logo para adaptarlo al diseño elegido.' },
    { selector: '#articleImportField', title: 'Importá una noticia', description: 'Pegá la URL de una nota de Diario Show o cargá la información manualmente.' },
    { selector: '.editor-panel .ds-texts-group', title: 'Editá los textos', description: 'Ajustá el titular, los estilos de texto, la alineación y el tamaño tipográfico.' },
    { selector: '.editor-panel .control-field:has(#file)', title: 'Agregá una fotografía', description: 'Seleccioná una imagen y arrastrala en la vista previa para reencuadrarla.' },
    { selector: '#photoStage', title: 'Revisá la vista previa', description: 'Comprobá el resultado sobre la placa antes de descargarla.' },
    { selector: 'body', title: 'Aprovechá el espacio', description: 'Si te falta espacio, probá el zoom del navegador al 90 % u 80 %. La exportación conserva su resolución.', fullScreen: true },
  ];
  const trigger = document.getElementById('dsOnboardingTrigger');
  const main = document.querySelector('main');
  const header = document.querySelector('header');
  if (!trigger || !main) return;
  let overlay = null, targetBox = null, dialog = null;
  let progress = null, heading = null, description = null, previous = null, next = null, dots = null;
  let open = false, current = 0, lastFocus = null, scheduled = 0;
  const completed = () => { try { return localStorage.getItem(storageKey) === 'complete'; } catch { return false; } };
  const remember = () => { try { localStorage.setItem(storageKey, 'complete'); } catch {} };
  const button = (cls, caption, action, accessibleName = caption) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = cls;
    item.textContent = caption;
    item.setAttribute('aria-label', accessibleName);
    item.addEventListener('click', action);
    return item;
  };
  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'dsOnboardingLayer';
    overlay.className = 'ds-tour-layer';
    overlay.hidden = true;
    targetBox = document.createElement('div');
    targetBox.className = 'ds-tour-target';
    targetBox.setAttribute('aria-hidden', 'true');
    dialog = document.createElement('section');
    dialog.className = 'ds-tour-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'dsTourHeading');
    dialog.setAttribute('aria-describedby', 'dsTourDescription');
    const top = document.createElement('div');
    top.className = 'ds-tour-top';
    progress = document.createElement('span');
    progress.className = 'ds-tour-progress';
    top.append(progress, button('ds-tour-close', '×', finish, 'Cerrar el recorrido'));
    heading = document.createElement('h2');
    heading.id = 'dsTourHeading';
    description = document.createElement('p');
    description.id = 'dsTourDescription';
    dots = document.createElement('div');
    dots.className = 'ds-tour-dots';
    dots.setAttribute('aria-hidden', 'true');
    const footer = document.createElement('div');
    footer.className = 'ds-tour-footer';
    const actions = document.createElement('div');
    actions.className = 'ds-tour-actions';
    previous = button('ds-tour-back', 'Anterior', () => show(current - 1));
    next = button('ds-tour-next', 'Siguiente', () => current === steps.length - 1 ? finish() : show(current + 1));
    actions.append(previous, next);
    footer.append(button('ds-tour-skip', 'Omitir', finish), actions);
    dialog.append(top, heading, description, dots, footer);
    overlay.append(targetBox, dialog);
    document.body.appendChild(overlay);
    overlay.addEventListener('pointerdown', event => {
      if (event.target === overlay) event.preventDefault();
    });
  }
  function position() {
    scheduled = 0;
    if (!open || !mq.matches) return;
    const step = steps[current];
    const target = document.querySelector(step.selector);
    if (!target) return;
    const vw = innerWidth, vh = innerHeight;
    const rect = step.fullScreen ? { left: 0, top: 0, right: vw, bottom: vh } : target.getBoundingClientRect();
    const pad = step.fullScreen ? 0 : 7;
    const left = Math.max(0, rect.left - pad), top = Math.max(0, rect.top - pad);
    const right = Math.min(vw, rect.right + pad), bottom = Math.min(vh, rect.bottom + pad);
    Object.assign(targetBox.style, {
      left: left + 'px', top: top + 'px',
      width: Math.max(0, right - left) + 'px', height: Math.max(0, bottom - top) + 'px'
    });
    const dw = Math.min(350, vw - 32), dh = dialog.offsetHeight || 240;
    const fitsRight = right + 20 + dw < vw - 16;
    const fitsLeft = left - 20 - dw > 16;
    let x, y;
    if (step.fullScreen) { x = (vw - dw) / 2; y = (vh - dh) / 2; }
    else if (fitsRight) { x = right + 20; y = top + (bottom - top - dh) / 2; }
    else if (fitsLeft) { x = left - 20 - dw; y = top + (bottom - top - dh) / 2; }
    else { x = Math.max(16, left + (right - left - dw) / 2); y = bottom + dh + 12 < vh ? bottom + 12 : top - dh - 12; }
    dialog.style.width = dw + 'px';
    dialog.style.left = Math.max(16, Math.min(vw - dw - 16, x)) + 'px';
    dialog.style.top = Math.max(12, Math.min(vh - dh - 12, y)) + 'px';
  }
  function schedule() { if (open && !scheduled) scheduled = requestAnimationFrame(position); }
  function show(index) {
    if (!open || index < 0 || index >= steps.length) return;
    current = index;
    const step = steps[current];
    progress.textContent = (index + 1) + ' de ' + steps.length;
    heading.textContent = step.title;
    description.textContent = step.description;
    previous.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? 'Finalizar' : 'Siguiente';
    next.setAttribute('aria-label', next.textContent);
    dots.replaceChildren(...steps.map((unused, i) => {
      const dot = document.createElement('span');
      if (i === current) dot.className = 'is-active';
      return dot;
    }));
    overlay.classList.toggle('ds-tour-fullscreen', Boolean(step.fullScreen));
    if (!step.fullScreen) document.querySelector(step.selector)?.scrollIntoView({ block: 'center', behavior: 'instant' });
    schedule();
    requestAnimationFrame(() => { position(); next.focus({ preventScroll: true }); });
  }
  function start() {
    if (!mq.matches || open) return;
    build();
    lastFocus = document.activeElement;
    open = true;
    overlay.hidden = false;
    main.inert = true;
    if (header) header.inert = true;
    show(0);
  }
  function finish() {
    if (!open) return;
    remember();
    open = false;
    if (scheduled) cancelAnimationFrame(scheduled);
    scheduled = 0;
    overlay.hidden = true;
    main.inert = false;
    if (header) header.inert = false;
    const focus = lastFocus instanceof HTMLElement && lastFocus.isConnected ? lastFocus : trigger;
    focus.focus({ preventScroll: true });
  }
  function onKey(event) {
    if (!open) return;
    if (event.key === 'Escape') { event.preventDefault(); finish(); return; }
    if (event.key !== 'Tab') return;
    const buttons = [...dialog.querySelectorAll('button:not([disabled])')];
    const index = buttons.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
    else if (!event.shiftKey && index === buttons.length - 1) { event.preventDefault(); buttons[0].focus(); }
  }
  document.addEventListener('keydown', onKey, true);
  const mqChanged = () => { if (!mq.matches) finish(); else schedule(); };
  mq.addEventListener('change', mqChanged);
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  trigger.addEventListener('click', start);
  if (mq.matches && (query.get('onboarding') === 'force' || !completed())) {
    window.addEventListener('load', () => requestAnimationFrame(() => requestAnimationFrame(start)), { once: true });
  }
})();
