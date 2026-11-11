(()=> {
  const main=document.querySelector('main');
  if(!main || !main.querySelector(':scope > .editor-panel') || !main.querySelector(':scope > .preview')) return;
  const tabs=document.createElement('nav');
  tabs.className='ds-mobile-tabs';
  tabs.setAttribute('aria-label','Secciones del editor');
  tabs.innerHTML='<button type="button" data-tab="format" aria-selected="true">Formato</button><button type="button" data-tab="preview" aria-selected="false">Vista previa</button>';
  main.before(tabs);
  const buttons=[...tabs.querySelectorAll('button')];
  const setTab=(tab)=>{
    document.body.dataset.dsMobileTab=tab;
    buttons.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
  };
  buttons.forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
  const logo=document.querySelector('.header-logo-link');
  logo?.addEventListener('click',(event)=>{
    if(!window.matchMedia('(max-width: 767px)').matches || document.body.dataset.dsMobileTab!=='preview') return;
    event.preventDefault();
    setTab('format');
    const content=document.querySelector('.editor-panel .panel-group');
    if(content) requestAnimationFrame(()=>content.scrollIntoView({behavior:'smooth',block:'start'}));
  });
  // Zona táctil del logo sobre la placa: 54 px extra por cada lado,
  // medidos en las coordenadas originales de 1080 × 1440.
  const stage=document.getElementById('photoStage');
  const canvas=document.getElementById('art');
  if(stage && canvas){
    const hit=document.createElement('button');
    hit.type='button';
    hit.className='ds-preview-logo-hit';
    hit.setAttribute('aria-label','Abrir contenido desde el logo de Diario Show');
    hit.title='Abrir contenido';
    Object.assign(hit.style,{position:'absolute',zIndex:'9999',background:'transparent',border:'0',padding:'0',cursor:'pointer',display:'none',touchAction:'manipulation'});
    stage.append(hit);
    const place=()=>{
      const mobile=window.matchMedia('(max-width: 767px)').matches;
      const visible=mobile && document.body.dataset.dsMobileTab==='preview';
      hit.style.display=visible?'block':'none';
      if(!visible)return;
      const rect=canvas.getBoundingClientRect();
      const parent=stage.getBoundingClientRect();
      const scale=rect.width/1080;
      const logoWidth=75*1.25*1.15;
      const logoHeight=logoWidth*275/253;
      const margin=80, extra=54;
      hit.style.left=(rect.left-parent.left+(1080-margin-logoWidth-extra)*scale)+'px';
      hit.style.top=(rect.top-parent.top+(margin-extra)*scale)+'px';
      hit.style.width=((logoWidth+2*extra)*scale)+'px';
      hit.style.height=((logoHeight+2*extra)*scale)+'px';
    };
    const openLogoContent=(event)=>{
      event?.preventDefault();
      event?.stopImmediatePropagation();
      event?.stopPropagation();
      setTab('format');
      document.querySelector('.editor-panel .panel-group')?.scrollIntoView({behavior:'smooth',block:'start'});
    };
    // Interceptar antes del dropzone, incluso si otro elemento recibe el toque.
    const insideLogo=(event)=>{
      if(hit.style.display==='none')return false;
      const bounds=hit.getBoundingClientRect();
      return event.clientX>=bounds.left && event.clientX<=bounds.right &&
        event.clientY>=bounds.top && event.clientY<=bounds.bottom;
    };
    stage.addEventListener('pointerdown',event=>{
      if(!insideLogo(event))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openLogoContent();
    },true);
    stage.addEventListener('click',event=>{
      if(insideLogo(event))openLogoContent(event);
    },true);
    hit.addEventListener('click',openLogoContent);
    buttons.forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(place)));
    window.addEventListener('resize',place);
    new ResizeObserver(place).observe(canvas);
    requestAnimationFrame(place);
  }
  setTab('format');
  document.body.classList.add('ds-mobile-ready');
})();