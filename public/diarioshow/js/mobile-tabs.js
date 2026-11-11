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
  setTab('format');
  document.body.classList.add('ds-mobile-ready');
})();