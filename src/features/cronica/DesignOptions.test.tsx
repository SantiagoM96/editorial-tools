import {afterEach,describe,it,expect} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {DesignOptions} from './DesignOptions';
import {isDesignSnapshot,initialDesign} from './design-model';
afterEach(cleanup);
describe('Diseño de Crónica React',()=>{
 it('valida el snapshot sin convertir botones en fuente canónica',()=>{
  expect(isDesignSnapshot(initialDesign)).toBe(true);
  expect(isDesignSnapshot({logoPosition:'top',footerStyle:'carousel'})).toBe(false);
 });
 it('permite ubicar logo y centrar firma conservando eventos tipados',()=>{
  const events:unknown[]=[];
  const fn=(e:Event)=>{if(e instanceof CustomEvent)events.push(e.detail)};
  window.addEventListener('editorial:cronica:design-command',fn);
  try{
   render(<DesignOptions variant="cover"/>);
   fireEvent.click(screen.getByRole('button',{name:'Logo a la izquierda'}));
   expect(events.at(-1)).toEqual({type:'set-logo-position',position:'left'});
   fireEvent.click(screen.getByRole('button',{name:'Centrada'}));
   expect(events.at(-1)).toEqual({type:'set-footer-style',style:'center'});
   fireEvent(window,new CustomEvent('editorial:cronica:design-state',{detail:{logoPosition:'left',footerStyle:'center'}}));
   expect(screen.getByRole('button',{name:'Centrada'}).getAttribute('aria-pressed')).toBe('true');
  }finally{window.removeEventListener('editorial:cronica:design-command',fn)}
 });
 it('no muestra pie en placa interior o Sin diseño',()=>{
  const {rerender}=render(<DesignOptions variant="internal"/>);
  expect(screen.queryByRole('button',{name:'Centrada'})).toBeNull();
  rerender(<DesignOptions variant="blank"/>);
  expect(screen.queryByRole('button',{name:'Logo a la izquierda'})).toBeNull();
 });
});
