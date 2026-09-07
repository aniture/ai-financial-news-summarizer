import { clsx } from "../lib/clsx";

/*
  Terminal control.

  Square corners, monospace label, and a press that actually moves. Disabled
  drops to an outline rather than a dimmed amber fill — amber at low opacity
  on this ground goes muddy.
*/

const VARIANTS = {
  solid:
    "bg-amber text-[#14100a] hover:brightness-110 disabled:border disabled:border-line disabled:bg-transparent disabled:text-mute",
  outline:
    "border border-line text-ink hover:border-amber hover:text-amber disabled:text-mute disabled:hover:border-line disabled:hover:text-mute",
  ghost:
    "text-mute hover:text-ink disabled:hover:text-mute",
};

const SIZES = {
  sm: "h-7 px-3 text-[10px]",
  md: "h-9 px-5 text-[11px]",
};

export function Button({
  variant = "solid",
  size = "md",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.16em]",
        "transition-[filter,color,border-color] duration-150",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-amber",
        "active:translate-y-px disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
