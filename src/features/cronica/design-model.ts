export type LogoPosition = 'left' | 'right';
export type FooterStyle = 'center' | 'carousel';
export interface DesignSnapshot { readonly logoPosition: LogoPosition; readonly footerStyle: FooterStyle; }
export type DesignCommand =
 | { readonly type: 'set-logo-position'; readonly position: LogoPosition }
 | { readonly type: 'set-footer-style'; readonly style: FooterStyle };
export const initialDesign: DesignSnapshot = {logoPosition:'right',footerStyle:'carousel'};
export function isDesignSnapshot(value: unknown): value is DesignSnapshot {
 if (typeof value !== 'object' || value === null) return false;
 const state = value as Record<string,unknown>;
 return (state.logoPosition==='left'||state.logoPosition==='right') &&
   (state.footerStyle==='center'||state.footerStyle==='carousel');
}
