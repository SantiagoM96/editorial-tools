import {describe,it,expect} from 'vitest';
import {formatChars,readMarkup,writeMarkup} from './rich-text-model';
describe('Marcado rico del editor Crónica',()=>{
 it('mantiene formatos combinados sin perder caracteres',()=>{
  const input='Hola *dato _importante_* y ~anterior~';
  expect(writeMarkup(readMarkup(input))).toBe(input);
 });
 it('aplica y retira formato a la selección, conservando el resto',()=>{
  const chars=readMarkup('El fútbol argentino');
  const selected=formatChars(chars,3,9,'accent');
  expect(writeMarkup(selected)).toBe('El *fútbol* argentino');
  expect(writeMarkup(formatChars(selected,3,9,'clear'))).toBe('El fútbol argentino');
 });
});
