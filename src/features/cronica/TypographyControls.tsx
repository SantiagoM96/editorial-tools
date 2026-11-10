import { useEffect, useState } from 'react';
import { editFormattedSelection, initialTypography, type TypographyFormat } from './typography-model';
import { setAlignment, subscribeToTypography, toggleUppercase } from './typography-bridge';

const formats = [
  { format: 'accent', id: 'formatAccent', title: 'Destacar selección (*texto*)', label: 'Destacar selección', icon: 'format_color_text' },
  { format: 'italic', id: 'formatItalic', title: 'Cursiva (_texto_)', label: 'Aplicar cursiva', icon: 'format_italic' },
  { format: 'strike', id: 'formatStrike', title: 'Tachado (~texto~)', label: 'Aplicar tachado', icon: 'strikethrough_s' },
] as const;

function applyFormat(format: TypographyFormat): void {
  const field = document.getElementById('headline');
  if (!(field instanceof HTMLTextAreaElement)) return;
  const result = editFormattedSelection(field.value, field.selectionStart, field.selectionEnd, format);
  if (!result) {
    field.focus();
    return;
  }
  // Conserva posición y longitud de selección; dispara la entrada normal del
  // editor legado para volver a dibujar el Canvas, sin manipular su renderer.
  field.value = result.text;
  field.setSelectionRange(result.start, result.end);
  field.focus();
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

export function TypographyControls() {
  const [typography, setTypography] = useState(initialTypography);
  useEffect(() => subscribeToTypography(setTypography), []);

  return (
    <div className="typography-row cronica-format-row">
      <div className="control-field format-field">
        <div className="help-label-row">
          <label>Formato de texto</label>
          <span className="help-trigger">
            <button type="button" className="help-button" aria-label="Ayuda sobre el formato de texto" aria-controls="formatTextHelp" aria-expanded="false">
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
              onClick={() => applyFormat(format)}
            >
              <span className="material-icons" aria-hidden="true">{icon}</span>
            </button>
          ))}
          <button type="button" id="formatUppercase" title="Mostrar todo el texto en mayúsculas" aria-label="Mostrar todo el texto en mayúsculas" aria-pressed={typography.uppercase} onClick={toggleUppercase}>
            <span className="material-symbols-outlined" aria-hidden="true">match_case</span>
          </button>
          <button type="button" id="formatClear" title="Quitar formato de la selección" aria-label="Quitar formato de la selección" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('clear')}>
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
