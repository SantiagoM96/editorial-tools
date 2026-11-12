import {useEffect,useState} from 'react';
import type {CrónicaVariant} from './carousel-model';
import {initialDesign,type DesignSnapshot} from './design-model';
import {issueDesignCommand,subscribeToDesign} from './design-bridge';
import {initialMedia} from './media-model';
import {subscribeToMedia} from './media-bridge';

export function DesignOptions({variant}:{readonly variant:CrónicaVariant}){
 const [state,setState]=useState<DesignSnapshot>(initialDesign);
 const [logo,setLogo]=useState(initialMedia.logo);
 useEffect(()=>subscribeToDesign(setState),[]);
 useEffect(()=>subscribeToMedia(snapshot=>setLogo(snapshot.logo)),[]);
 if(variant==='blank')return null;
 return (
  <>
   {logo!=='none'&&<div className="control-field editor-logo-position-field">
    <label>Ubicación logo</label>
    <div className="editor-logo-position-controls" role="group" aria-label="Ubicación horizontal del logo">
     {(['left','right'] as const).map(position=><button key={position} type="button" className="editor-logo-position-button"
       data-logo-position={position} aria-label={position==='left'?'Logo a la izquierda':'Logo a la derecha'}
       aria-pressed={state.logoPosition===position}
       onClick={()=>issueDesignCommand({type:'set-logo-position',position})}>
       <span className="material-symbols-outlined" aria-hidden="true">{position==='left'?'align_horizontal_left':'align_horizontal_right'}</span>
     </button>)}
    </div>
   </div>}
   {variant==='cover'&&<div className="control-field modern-footer-field">
    <label>Firma inferior</label>
    <div className="modern-footer-options" role="group" aria-label="Firma inferior">
     {(['center','carousel'] as const).map(style=><button type="button" key={style} data-footer-style={style}
       aria-pressed={state.footerStyle===style} onClick={()=>issueDesignCommand({type:'set-footer-style',style})}>
       <span className="material-symbols-outlined" aria-hidden="true">{style==='center'?'format_align_center':'view_carousel'}</span>
       <span>{style==='center'?'Centrada':'Carrusel'}</span>
     </button>)}
    </div>
   </div>}
  </>
 );
}
