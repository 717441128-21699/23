import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardVariant = "default" | "subtle";
type GlassCardPadding = "sm" | "md" | "lg";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: GlassCardVariant;
  padding?: GlassCardPadding;
  hover?: boolean;
  children: ReactNode;
}

const variantClasses: Record<GlassCardVariant, string> = {
  default: "glass shadow-glass",
  subtle: "glass-subtle",
};

const paddingClasses: Record<GlassCardPadding, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export default function GlassCard({
  variant = "default",
  padding = "md",
  hover = true,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow: "0 12px 40px rgba(79, 142, 247, 0.15)",
              borderColor: "rgba(79, 142, 247, 0.25)",
            }
          : undefined
      }
      className={cn(
        "rounded-xl transition-all duration-300",
        variantClasses[variant],
        paddingClasses[padding],
        hover && "hover:border-magnetic-blue/30 cursor-default",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
