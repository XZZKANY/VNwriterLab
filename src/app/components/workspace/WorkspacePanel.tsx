import type { ReactNode } from "react";

interface WorkspacePanelProps {
  title?: ReactNode;
  description?: ReactNode;
  ariaLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function WorkspacePanel({
  title,
  description,
  ariaLabel,
  actions,
  children,
  className,
}: WorkspacePanelProps) {
  const composedClassName = className
    ? `workspace-panel ${className}`
    : "workspace-panel";

  return (
    <section className={composedClassName} aria-label={ariaLabel}>
      {(title || actions) && (
        <header className="workspace-panel__header">
          {title ? <h3 className="workspace-panel__title">{title}</h3> : null}
          {actions ? (
            <div className="workspace-panel__actions">{actions}</div>
          ) : null}
        </header>
      )}
      {description ? (
        <p className="workspace-panel__description">{description}</p>
      ) : null}
      <div className="workspace-panel__body">{children}</div>
    </section>
  );
}
