import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-[6px] border text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 h-8 px-3",
  {
    variants: {
      variant: {
        primary: "border-accent bg-accent text-white hover:bg-[#17382d]",
        secondary: "border-line bg-panel text-ink hover:bg-paper",
        ghost: "border-transparent bg-transparent text-ink hover:bg-paper",
        danger: "border-danger bg-white text-danger hover:bg-[#f8ecec]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}
