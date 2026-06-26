import type { ReactNode } from "react";

export function ScreenMessage({
  title,
  body,
  action,
}: {
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="screen-state">
      <div className="screen-state__panel">
        <strong>{title}</strong>
        {body ? <p>{body}</p> : null}
        {action}
      </div>
    </div>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "gold" | "green" | "red" | "slate";
}) {
  return <span className={`status-badge status-badge--${tone}`}>{label}</span>;
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

export function ProgressBar({
  value,
}: {
  value: number;
}) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export function BottomButtonRow({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="bottom-button-row">
      {secondary}
      {primary}
    </div>
  );
}
