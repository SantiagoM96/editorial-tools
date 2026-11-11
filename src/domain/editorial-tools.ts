import type { EditorialTool } from './editorial-tool';

export const editorialTools = [
  {
    id: 'cronica',
    title: 'Crónica',
    description: 'Generador de posteos y carruseles para Instagram.',
    href: './cronica/',
    logoPath: './cronica/cronica-header-logo.svg',
    logoAlt: 'Crónica',
    accessibleLabel: 'Abrir generador de Crónica',
    logoClassName: 'logo-cronica',
  },
  {
    id: 'bae',
    title: 'BAE Negocios',
    description: 'Generador de placas para Instagram con plantillas editoriales.',
    href: './bae/',
    logoPath: './bae/bae-negocios-logo-color.svg',
    logoAlt: 'BAE Negocios',
    accessibleLabel: 'Abrir generador de BAE Negocios',
  },
  {
    id: 'diarioshow',
    title: 'Diario Show',
    description: 'Generador de placas para Instagram. Versión inicial en preparación.',
    href: './diarioshow/',
    logoPath: './diarioshow/logos/dashboard.svg',
    logoAlt: 'Diario Show',
    accessibleLabel: 'Abrir generador de Diario Show',
    logoClassName: 'logo-diarioshow',
  },
] as const satisfies ReadonlyArray<EditorialTool>;
