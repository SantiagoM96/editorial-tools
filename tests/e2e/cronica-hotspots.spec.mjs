import {test,expect} from '@playwright/test';
test('Crónica: zonas contextuales abren los paneles sin alterar el Canvas',async({page})=>{
 await page.goto('/cronica/?onboarding=off',{waitUntil:'load'});
 const logo=page.locator('#cronicaLogoHit');
 await expect(logo).toBeAttached();
 await logo.click({force:true});
 await expect(page.locator('.cronica-variant-panel .modern-toggle')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('.cronica-variant-panel .logo-choice[aria-pressed=true]')).toBeFocused();
 const text=page.locator('#cronicaTextHit');
 await text.click({force:true});
 await expect(page.getByRole('textbox',{name:'Texto principal en edición visual'})).toBeFocused();
});
