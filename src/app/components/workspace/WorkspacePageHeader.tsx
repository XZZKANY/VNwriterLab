import type { ReactNode } from "react";

export interface WorkspaceAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface WorkspacePageHeaderProps {
  title: string;
  description?: ReactNode;
  primaryAction?: WorkspaceAction;
  secondaryActions?: ReadonlyArray<WorkspaceAction>;
}

export function WorkspacePageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
}: WorkspacePageHeaderProps) {
  return (
    <header className="workspace-page-header">
      <div className="workspace-page-header__content">
        <h2 className="workspace-page-header__title">{title}</h2>
        {description ? (
          <p className="workspace-page-header__description">{description}</p>
        ) : null}
      </div>
      {(primaryAction || (secondaryActions && secondaryActions.length > 0)) && (
        <div className="workspace-page-header__actions">
          {secondaryActions?.map((action) => (
            <button
              key={action.label}
              type="button"
              className="workspace-page-header__secondary"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
          {primaryAction ? (
            <button
              type="button"
              className="workspace-page-header__primary"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
            >
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}
