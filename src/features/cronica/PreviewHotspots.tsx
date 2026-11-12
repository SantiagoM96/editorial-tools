import { useEffect } from 'react';

function revealAccordion(selector:string) {
 const panel=document.querySelector<HTMLElement>(selector);
 const button=panel?.querySelector<HTMLButtonElement>('.modern-toggle');
 if(button?.getAttribute('aria-expanded')==='false')button.click();
 panel?.scrollIntoView({block:'nearest',behavior:'smooth'});
 return panel;
}

/** Dos zonas de acceso contextual al mismo estado React/Canvas; sin copiar ni dibujar contenido. */
export function PreviewHotspots() {
 useEffect(()=>{
  const logo=document.getElementById('cronicaLogoHit');
  const text=document.getElementById('cronicaTextHit');
  const onLogo=()=>{
   if(window.matchMedia('(max-width:700px)').matches)document.getElementById('cronicaTabFormat')?.click();
   revealAccordion('.cronica-variant-panel');
   document.querySelector<HTMLButtonElement>('.cronica-variant-panel .logo-choice[aria-pressed="true"]')?.focus({preventScroll:true});
  };
  const onText=()=>{
   if(window.matchMedia('(max-width:700px)').matches)return;
   revealAccordion('.cronica-text-panel');
   document.querySelector<HTMLTextAreaElement>('#headline')?.focus({preventScroll:true});
  };
  logo?.addEventListener('click',onLogo);text?.addEventListener('click',onText);
  return ()=>{logo?.removeEventListener('click',onLogo);text?.removeEventListener('click',onText)};
 },[]);
 return null;
}
