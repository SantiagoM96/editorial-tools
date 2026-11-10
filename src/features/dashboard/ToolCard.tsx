import type { EditorialTool } from '../../domain/editorial-tool';

interface ToolCardProps {
  readonly tool: EditorialTool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <a className="product" href={tool.href} aria-label={tool.accessibleLabel}>
      <div className="logo-area">
        <img className={tool.logoClassName} src={tool.logoPath} alt={tool.logoAlt} />
      </div>
      <h2>{tool.title}</h2>
      <p>{tool.description}</p>
      <span className="open">
        Abrir generador <span className="arrow" aria-hidden="true">→</span>
      </span>
    </a>
  );
}
