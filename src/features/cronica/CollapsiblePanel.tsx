import { useId, useState, type ReactNode } from 'react';

interface CollapsiblePanelProps {
  readonly title: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * Composición React: los controles siguen montados al plegar el panel.
 * No duplica el estado de edición ni interfiere con los eventos del motor.
 */
export function CollapsiblePanel({ title, className = '', children }: CollapsiblePanelProps) {
  const bodyId = useId();
  const [expanded, setExpanded] = useState(true);

  return (
    <section className={`panel-group modern-card ${className}`.trim()} aria-label={title}>
      <button
        type="button"
        className="modern-toggle"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={() => setExpanded((previous) => !previous)}
      >
        <span>{title}</span>
        <span className="material-icons modern-chevron" aria-hidden="true">expand_less</span>
      </button>
      <div id={bodyId} className="modern-body" hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}
