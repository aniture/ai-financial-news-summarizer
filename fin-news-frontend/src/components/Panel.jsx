import { clsx } from "../lib/clsx";

/*
  A lit surface on the terminal ground.

  `active` raises a hairline amber keyline down the left edge — the way a
  terminal marks the row you are working in. It is the only place a panel
  takes colour, so it stays meaningful.
*/
export function Panel({ active, className, children, ...props }) {
  return (
    <div
      className={clsx(
        "panel relative",
        active && "before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-amber",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ label, right, className }) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 border-b border-line px-4 py-2.5",
        className
      )}
    >
      <span className="label">{label}</span>
      {right}
    </div>
  );
}

/* Ruled key/value line used by the readout. */
export function Row({ k, children }) {
  return (
    <div className="flex gap-4 border-b border-line-soft py-2.5 last:border-b-0">
      <span className="label w-24 shrink-0 pt-0.5">{k}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
