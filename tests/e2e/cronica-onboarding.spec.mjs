import {test,expect} from '@playwright/test';
test('Crónica: onboarding contextual de ocho pasos, reinicio y persistencia',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/cronica/?onboarding=force',{waitUntil:'load'});
 const dialog=page.getByRole('dialog',{name:'Organizá las páginas'});
 await expect(dialog).toBeVisible();
 await expect(page.locator('#dsTourProgress')).toHaveText('1 de 8');
 for(let i=2;i<=8;i++){
  await page.getByRole('button',{name:'Siguiente'}).click();
  await expect(page.locator('#dsTourProgress')).toHaveText(i+' de 8');
 }
 await expect(page.getByRole('dialog',{name:'¿Poco espacio?'})).toBeVisible();
 await page.getByRole('button',{name:'Finalizar'}).click();
 await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('cronica-dev-tour-desktop-v1'))).toBe('complete');
 await page.reload({waitUntil:'load'});
 await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
 await page.getByRole('button',{name:'Abrir onboarding interactivo'}).click();
 await expect(page.locator('#dsTourProgress')).toHaveText('1 de 8');
 await page.getByRole('button',{name:'Omitir'}).click();
});
test('Crónica: se puede omitir onboarding en QA y nunca aparece en mobile',async({page})=>{
 await page.goto('/cronica/?onboarding=off',{waitUntil:'load'});
 await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
 await expect(page.locator('#dsOnboardingTrigger')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});
 await page.goto('/cronica/?onboarding=force',{waitUntil:'load'});
 await expect(page.locator('#dsOnboardingLayer')).toHaveCount(0);
});
