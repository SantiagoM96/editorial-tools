import { useEffect, useRef, useState } from 'react';
import type { TypographyFormat, TypographyState } from './typography-model';
import { setAlignment, toggleUppercase } from './typography-bridge';

const formats = [
  { format: 'accent', id: 'formatAccent', title: 'Destacar selección (*texto*)', label: 'Destacar selección', icon: 'format_color_text' },
  { format: 'italic', id: 'formatItalic', title: 'Cursiva (_texto_)', label: 'Aplicar cursiva', icon: 'format_italic' },
  { format: 'strike', id: 'formatStrike', title: 'Tachado (~texto~)', label: 'Aplicar tachado', icon: 'strikethrough_s' },
] as const;

interface TypographyControlsProps {
  readonly typography: TypographyState;
  readonly onFormat: (format: TypographyFormat) => void;
}

export function TypographyControls({ typography, onFormat }: TypographyControlsProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !helpRef.current?.contains(event.target)) {
        setHelpOpen(false);
      }
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

  const measureHelp = () => {
    const panel = helpRef.current?.closest('.editor-panel');
    const button = helpRef.current?.querySelector('.help-button');
    if (!panel || !button) return;
    const space = panel.getBoundingClientRect().right - button.getBoundingClientRect().right - 24;
    helpRef.current?.style.setProperty('--help-available-width', Math.max(96, Math.floor(space)) + 'px');
  };

  return (
    <div className="typography-row cronica-format-row">
      <div className="control-field format-field">
        <div className="help-label-row">
          <label>Formato de texto</label>
          <span
            ref={helpRef}
            className={helpOpen ? 'help-trigger is-open' : 'help-trigger'}
            onPointerEnter={measureHelp}
            onFocusCapture={measureHelp}
          >
            <button type="button" className="help-button" aria-label="Ayuda sobre el formato de texto" aria-controls="formatTextHelp" aria-expanded={helpOpen} onClick={() => setHelpOpen((open) => !open)}>
              <span className="material-icons" aria-hidden="true">info_outline</span>
            </button>
            <span className="help-tooltip" id="formatTextHelp" role="tooltip">
              Seleccioná un fragmento para aplicarle formato. El botón de mayúsculas cambia la visualización sin modificar lo escrito.
            </span>
          </span>
        </div>
        <div className="format-buttons" role="group" aria-label="Formato del texto seleccionado">
          {formats.map(({ format, id, title, label, icon }) => (
            <button
              key={id}
              type="button"
              id={id}
              title={title}
              aria-label={label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onFormat(format)}
            >
              <span className="material-icons" aria-hidden="true">{icon}</span>
            </button>
          ))}
          <button type="button" id="formatUppercase" title="Mostrar todo el texto en mayúsculas" aria-label="Mostrar todo el texto en mayúsculas" aria-pressed={typography.uppercase} onClick={toggleUppercase}>
            <span className="material-symbols-outlined" aria-hidden="true">match_case</span>
          </button>
          <button type="button" id="formatClear" title="Quitar formato de la selección" aria-label="Quitar formato de la selección" onMouseDown={(event) => event.preventDefault()} onClick={() => onFormat('clear')}>
            <span className="material-icons" aria-hidden="true">delete_outline</span>
          </button>
        </div>
      </div>
      <div className="control-field align-field">
        <div className="help-label-row"><label>Alineación</label></div>
        <div className="align-buttons" role="group" aria-label="Alineación del texto">
          <button id="alignLeft" type="button" aria-label="Alinear a la izquierda" title="Alinear a la izquierda" aria-pressed={typography.alignment === 'left'} onClick={() => setAlignment('left')}>
            <span className="material-icons" aria-hidden="true">format_align_left</span>
          </button>
          <button id="alignCenter" type="button" aria-label="Alinear al centro" title="Alinear al centro" aria-pressed={typography.alignment === 'center'} onClick={() => setAlignment('center')}>
            <span className="material-icons" aria-hidden="true">format_align_center</span>
          </button>
        </div>
      </div>
    </div>
  );
}
