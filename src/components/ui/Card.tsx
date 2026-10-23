import clsx from "clsx";

/** Surface container used by every dashboard panel. */
export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4">
          <div>
            {title && <h2 className="text-[14.5px] font-semibold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-2">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={clsx("p-5", title && "pt-3", bodyClassName)}>{children}</div>
    </section>
  );
}
