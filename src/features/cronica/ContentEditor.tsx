import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { initialContent, type ContentCommand } from './content-model';
import { issueContentCommand, subscribeToContent } from './content-bridge';
import { editFormattedSelection, initialTypography, type TypographyFormat } from './typography-model';
import { subscribeToTypography } from './typography-bridge';
import { TypographyControls } from './TypographyControls';

type Caret = { readonly start: number; readonly end: number };

export function ContentEditor() {
  // La copia React es una proyección del documento heredado, nunca una segunda
  // fuente de verdad. El render Canvas recibe el mismo snapshot.
  const [content, setContent] = useState(initialContent);
  const [typography, setTypography] = useState(initialTypography);
  const [helpOpen, setHelpOpen] = useState(false);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const strapRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLSpanElement>(null);
  const headlineCaret = useRef<Caret | null>(null);
  const strapCaret = useRef<Caret | null>(null);

  useEffect(() => subscribeToContent(setContent), []);
  useEffect(() => subscribeToTypography(setTypography), []);

  useLayoutEffect(() => {
    if (headlineCaret.current && headlineRef.current) {
      headlineRef.current.focus();
      headlineRef.current.setSelectionRange(headlineCaret.current.start, headlineCaret.current.end);
      headlineCaret.current = null;
    }
    if (strapCaret.current && strapRef.current && document.activeElement === strapRef.current) {
      strapRef.current.setSelectionRange(strapCaret.current.start, strapCaret.current.end);
      strapCaret.current = null;
    }
  });

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !helpRef.current?.contains(event.target)) setHelpOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHelpOpen(false);
    };
    document.addEventListener('click', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('click', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const change = (command: ContentCommand) => issueContentCommand(command);

  const formatSelection = (format: TypographyFormat) => {
    const field = headlineRef.current;
    if (!field) return;
    const result = editFormattedSelection(field.value, field.selectionStart, field.selectionEnd, format);
    if (!result) {
      field.focus();
      return;
    }
    headlineCaret.current = { start: result.start, end: result.end };
    change({ field: 'headline', value: result.text });
  };

  const measureHelp = () => {
    const panel = helpRef.current?.closest('.editor-panel');
    const button = helpRef.current?.querySelector('.help-button');
    if (!panel || !button) return;
    const space = panel.getBoundingClientRect().right - button.getBoundingClientRect().right - 24;
    helpRef.current?.style.setProperty('--help-available-width', Math.max(96, Math.floor(space)) + 'px');
  };

  return (
    <>
      <div className="control-field">
        <label className="switch-row" htmlFor="showStrap">
          <span>Mostrar volanta</span>
          <span className="switch">
            <input
              id="showStrap"
              type="checkbox"
              role="switch"
              checked={content.showStrap}
              onChange={(event) => change({ field: 'showStrap', value: event.currentTarget.checked })}
            />
            <span className="switch-track" />
          </span>
        </label>
      </div>
      <div className="control-field" id="strapField" hidden={!content.showStrap}>
        <div className="help-label-row">
          <label htmlFor="strapText">Texto de la volanta</label>
          <span
            ref={helpRef}
            className={helpOpen ? 'help-trigger is-open' : 'help-trigger'}
            onPointerEnter={measureHelp}
            onFocusCapture={measureHelp}
          >
            <button
              type="button"
              className="help-button"
              aria-label="Ayuda sobre el texto de la volanta"
              aria-controls="strapTextHelp"
              aria-expanded={helpOpen}
              onClick={() => setHelpOpen((previous) => !previous)}
            >
              <span className="material-icons" aria-hidden="true">info_outline</span>
            </button>
            <span className="help-tooltip" id="strapTextHelp" role="tooltip">
              Máximo una línea. El tamaño se ajusta automáticamente al ancho disponible.
            </span>
          </span>
        </div>
        <input
          ref={strapRef}
          id="strapText"
          type="text"
          maxLength={140}
          value={content.strapText}
          placeholder="Escribí el texto de la volanta"
          onChange={(event) => {
            const field = event.currentTarget;
            strapCaret.current = { start: field.selectionStart ?? 0, end: field.selectionEnd ?? 0 };
            change({ field: 'strapText', value: field.value });
          }}
        />
      </div>
      <div className="control-field">
        <label htmlFor="headline">Texto principal</label>
        <textarea
          ref={headlineRef}
          id="headline"
          className={typography.uppercase ? 'uppercase-preview' : undefined}
          value={content.headline}
          onChange={(event) => change({ field: 'headline', value: event.currentTarget.value })}
        />
      </div>
      <div className="control-field size-field">
        <label htmlFor="size">
          Tamaño de tipografía: <output id="sizeLabel">{content.size}</output> px
        </label>
        <input
          id="size"
          type="range"
          min="32"
          max="95"
          value={content.size}
          onChange={(event) => change({ field: 'size', value: Number(event.currentTarget.value) })}
        />
      </div>
      <TypographyControls typography={typography} onFormat={formatSelection} />
    </>
  );
}
