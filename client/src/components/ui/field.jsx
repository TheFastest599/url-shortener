import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  className,
  orientation = "vertical",
  ...props
}) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        "flex w-full",
        orientation === "horizontal"
          ? "flex-row items-center gap-2"
          : "flex-col gap-1.5",
        className
      )}
      {...props}
    />
  );
}

export function FieldLabel({ className, ...props }) {
  return (
    <label
      data-slot="field-label"
      className={cn("text-xs font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  );
}

export function FieldDescription({ className, ...props }) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-[11px] text-muted-foreground", className)}
      {...props}
    />
  );
}

export function FieldGroup({ className, ...props }) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
}
