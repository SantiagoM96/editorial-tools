import {test,expect} from '@playwright/test';
test('Crónica React: Shift + clic controla todos los módulos del editor',async({page})=>{
 await page.goto('/cronica/?onboarding=off',{waitUntil:'load'});
 const panels=page.locator('.editor-panel .modern-card .modern-toggle');
 await expect(panels).toHaveCount(3);
 for(const button of await panels.all())await expect(button).toHaveAttribute('aria-expanded','true');
 await panels.first().click({modifiers:['Shift']});
 for(const button of await panels.all())await expect(button).toHaveAttribute('aria-expanded','false');
 await panels.last().click({modifiers:['Shift']});
 for(const button of await panels.all())await expect(button).toHaveAttribute('aria-expanded','true');
 await panels.nth(1).click();
 await expect(panels.nth(1)).toHaveAttribute('aria-expanded','false');
 await expect(panels.first()).toHaveAttribute('aria-expanded','true');
 await panels.first().click({modifiers:['Shift']});
 for(const button of await panels.all())await expect(button).toHaveAttribute('aria-expanded','true');
});
