import { useEffect, useState, type KeyboardEvent } from 'react';

type MobileTab = 'preview' | 'format';

export function MobileEditorTabs() {
  const [active, setActive] = useState<MobileTab>('preview');
  useEffect(() => {
    const main = document.querySelector('main');
    const panel = document.getElementById('cronicaEditorPanel');
    const preview = document.getElementById('cronicaPreviewPanel');
    const mq = window.matchMedia('(max-width: 700px)');
    if (!main || !panel || !preview) return;

    const sync = () => {
      main.setAttribute('data-cronica-mobile-tab', active);
      panel.inert = mq.matches && active !== 'format';
      preview.inert = mq.matches && active !== 'preview';
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      panel.inert = false;
      preview.inert = false;
    };
  }, [active]);

  const onKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next: MobileTab = event.key === 'Home' ? 'preview'
      : event.key === 'End' ? 'format'
      : active === 'preview' ? 'format' : 'preview';
    setActive(next);
    document.getElementById(next === 'preview' ? 'cronicaTabPreview' : 'cronicaTabFormat')?.focus();
  };

  return (
    <nav className="cronica-mobile-tabs" role="tablist" aria-label="Secciones del editor" onKeyDown={onKeys}>
      <button id="cronicaTabPreview" role="tab" type="button" aria-controls="cronicaPreviewPanel"
        aria-selected={active === 'preview'} tabIndex={active === 'preview' ? 0 : -1}
        onClick={() => setActive('preview')}>Vista previa</button>
      <button id="cronicaTabFormat" role="tab" type="button" aria-controls="cronicaEditorPanel"
        aria-selected={active === 'format'} tabIndex={active === 'format' ? 0 : -1}
        onClick={() => setActive('format')}>Formato</button>
    </nav>
  );
}
