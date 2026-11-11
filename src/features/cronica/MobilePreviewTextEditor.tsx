import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { initialContent, type ContentCommand } from './content-model';
import { issueContentCommand, subscribeToContent } from './content-bridge';
import { editFormattedSelection, initialTypography, type TypographyFormat } from './typography-model';
import { setAlignment, subscribeToTypography, toggleUppercase } from './typography-bridge';

/** Proyección independiente de UI sobre el documento canónico del motor. */
export function MobilePreviewTextEditor() {
  const [content, setContent] = useState(initialContent);
  const [typography, setTypography] = useState(initialTypography);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<{ start: number; end: number } | null>(null);

  useEffect(() => subscribeToContent(setContent), []);
  useEffect(() => subscribeToTypography(setTypography), []);
  useLayoutEffect(() => {
    const field = headlineRef.current;
    if (!field || !caret.current) return;
    field.focus({ preventScroll: true });
    field.setSelectionRange(caret.current.start, caret.current.end);
    caret.current = null;
  });

  useEffect(() => {
    const hit = document.getElementById('cronicaTextHit');
    const focus = () => {
      headlineRef.current?.focus({ preventScroll: true });
      headlineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    hit?.addEventListener('click', focus);
    return () => hit?.removeEventListener('click', focus);
  }, []);

  const change = (command: ContentCommand) => issueContentCommand(command);
  const format = (value: TypographyFormat) => {
    const field = headlineRef.current;
    if (!field) return;
    const result = editFormattedSelection(field.value, field.selectionStart, field.selectionEnd, value);
    if (!result) { field.focus(); return; }
    caret.current = { start: result.start, end: result.end };
    change({ field: 'headline', value: result.text });
  };

  return (
    <section className="cronica-preview-text-editor" aria-label="Editar textos desde la vista previa">
      <h2>Editar textos</h2>
      <label htmlFor="headlineMobile">Texto principal</label>
      <textarea id="headlineMobile" ref={headlineRef}
        className={typography.uppercase ? 'uppercase-preview' : undefined}
        value={content.headline}
        onChange={(event) => change({ field: 'headline', value: event.currentTarget.value })} />
      <label htmlFor="sizeMobile">Tamaño de tipografía: <output>{content.size}</output> px</label>
      <input id="sizeMobile" type="range" min="32" max="95" step="1" value={content.size}
        onChange={(event) => change({ field: 'size', value: Number(event.currentTarget.value) })} />
      <label htmlFor="showStrapMobile" className="cronica-mobile-switch">
        <input id="showStrapMobile" type="checkbox" checked={content.showStrap}
          onChange={(event) => change({ field: 'showStrap', value: event.currentTarget.checked })} />
        Mostrar volanta
      </label>
      {content.showStrap && (
        <>
          <label htmlFor="strapTextMobile">Texto de la volanta</label>
          <input id="strapTextMobile" type="text" maxLength={140} value={content.strapText}
            onChange={(event) => change({ field: 'strapText', value: event.currentTarget.value })} />
        </>
      )}
      <div className="cronica-mobile-format" role="group" aria-label="Formato de texto móvil">
        <button type="button" aria-label="Destacar selección desde la vista previa"
          onPointerDown={(event) => event.preventDefault()} onClick={() => format('accent')}>Destacar</button>
        <button type="button" aria-label="Aplicar cursiva desde la vista previa"
          onPointerDown={(event) => event.preventDefault()} onClick={() => format('italic')}>Cursiva</button>
        <button type="button" aria-label="Tachar selección desde la vista previa"
          onPointerDown={(event) => event.preventDefault()} onClick={() => format('strike')}>Tachar</button>
        <button type="button" aria-label="Quitar formato desde la vista previa"
          onPointerDown={(event) => event.preventDefault()} onClick={() => format('clear')}>Limpiar formato</button>
        <button type="button" aria-label="Mostrar mayúsculas desde la vista previa"
          aria-pressed={typography.uppercase} onClick={toggleUppercase}>Mayúsculas</button>
        <button type="button" aria-label="Alinear a la izquierda desde la vista previa"
          aria-pressed={typography.alignment === 'left'} onClick={() => setAlignment('left')}>Izquierda</button>
        <button type="button" aria-label="Alinear al centro desde la vista previa"
          aria-pressed={typography.alignment === 'center'} onClick={() => setAlignment('center')}>Centro</button>
      </div>
    </section>
  );
}
