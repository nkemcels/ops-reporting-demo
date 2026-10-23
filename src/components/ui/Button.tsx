import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "px-2.5 py-1.5 text-[12.5px]" : "px-3.5 py-2 text-[13.5px]",
        variant === "primary" && "bg-brand text-white hover:bg-[#1640b5]",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-surface-2",
        variant === "ghost" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
        variant === "danger" && "border border-line bg-surface text-critical hover:bg-red-50",
        className,
      )}
    />
  );
}
