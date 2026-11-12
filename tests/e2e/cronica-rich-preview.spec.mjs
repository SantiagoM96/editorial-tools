import {test,expect} from '@playwright/test';
test('Crónica React: edición enriquecida desde el Canvas conserva el documento y los PNG',async({page})=>{
 await page.goto('/cronica/?onboarding=off',{waitUntil:'load'});
 await page.locator('#cronicaTextHit').click({force:true});
 const visual=page.getByRole('textbox',{name:'Texto principal en edición visual'});
 await expect(visual).toBeVisible();
 await visual.fill('El fútbol argentino');
 await expect(page.locator('#headline')).toHaveValue('El fútbol argentino');
 await visual.evaluate(node=>{
  const first=node.firstChild;
  const range=document.createRange();range.setStart(first,3);range.setEnd(first,9);
  const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
 });
 await page.getByRole('button',{name:'Destacar selección',exact:true}).last().click();
 await expect(page.locator('#headline')).toHaveValue('El *fútbol* argentino');
 await expect(visual).toContainText('El fútbol argentino');
 const download=page.waitForEvent('download');
 await page.locator('#download').click();
 expect((await download).suggestedFilename()).toMatch(/\.png$/i);
});
