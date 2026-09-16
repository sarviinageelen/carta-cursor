import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[#eef0ea] text-ink",
    success: "bg-[#e4f3ea] text-success",
    warning: "bg-[#f7efd8] text-warning",
    danger: "bg-[#f8ecec] text-danger",
    info: "bg-[#e7eef6] text-info",
    accent: "bg-accent-soft text-accent",
  };
  return (
    <span className={cn("inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
