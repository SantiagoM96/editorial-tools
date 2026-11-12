import { useEffect, useState } from 'react';
import { initialMedia, type BrandLogo } from './media-model';
import { sendMediaCommand, subscribeToMedia } from './media-bridge';

const logos = [
 { id: 'none', title: 'Sin logo', text: 'Sin logo', src: null },
 { id: 'primary', title: 'Logo primario: rojo con C blanca', text: 'Primario', src: '../cronica/logos/primario.svg' },
 { id: 'secondary', title: 'Logo secundario: blanco con C roja', text: 'Secundario', src: '../cronica/logos/secundario.svg' },
 { id: 'white', title: 'Logo todo blanco', text: 'Blanco', src: '../cronica/logos/blanco.svg' },
] as const satisfies ReadonlyArray<{id: BrandLogo;title:string;text:string;src:string|null}>;

export function BrandControls() {
 const [media,setMedia]=useState(initialMedia);
 useEffect(()=>subscribeToMedia(setMedia),[]);
 return (
         <div className="control-field logo-control-field">
        <label>Logo Crónica</label>
        <div className="logo-choices" role="group" aria-label="Seleccionar logo de la placa">
          {logos.map((logo) => (
            <button
              key={logo.id}
              type="button"
              className="logo-choice"
              data-logo={logo.id}
              aria-pressed={media.logo === logo.id}
              title={logo.title}
              onClick={() => sendMediaCommand({ type: 'set-logo', logo: logo.id })}
            >
              {logo.src ? (
                <span className="logo-choice-preview">
                  <img src={logo.src} alt="" />
                </span>
              ) : (
                <span className="logo-choice-preview no-logo">
                  <span className="material-icons" aria-hidden="true">hide_image</span>
                </span>
              )}
              <span>{logo.text}</span>
            </button>
          ))}
        </div>
      </div>
 );
}
