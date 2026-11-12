import { useEffect, useId, useState, type MouseEvent, type ReactNode } from 'react';

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
  useEffect(() => {
    const changeAll = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail?.expanded === 'boolean') {
        setExpanded(event.detail.expanded);
      }
    };
    window.addEventListener('editorial:cronica:accordion-all', changeAll);
    return () => window.removeEventListener('editorial:cronica:accordion-all', changeAll);
  }, []);

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (!event.shiftKey) { setExpanded(previous => !previous); return; }
    const sections = [...document.querySelectorAll<HTMLButtonElement>('.modern-card .modern-toggle')];
    const shouldExpand = sections.some(section => section.getAttribute('aria-expanded') === 'false');
    window.dispatchEvent(new CustomEvent('editorial:cronica:accordion-all', {
      detail: { expanded: shouldExpand },
    }));
  };

  return (
    <section className={`panel-group modern-card ${className}`.trim()} aria-label={title}>
      <button
        type="button"
        className="modern-toggle"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={toggle}
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
