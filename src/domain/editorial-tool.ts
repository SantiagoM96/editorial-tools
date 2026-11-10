export type EditorialToolId = 'cronica' | 'bae' | 'diarioshow';

export interface EditorialTool {
  readonly id: EditorialToolId;
  readonly title: string;
  readonly description: string;
  readonly href: `./${EditorialToolId}/`;
  readonly logoPath: string;
  readonly logoAlt: string;
  readonly accessibleLabel: string;
  readonly logoClassName?: string;
}
