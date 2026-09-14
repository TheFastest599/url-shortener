import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { IconSearch, IconX } from "@tabler/icons-react";

export function InputInline({
  value = "",
  onChange,
  onSubmit,
  placeholder = "Search...",
  buttonText = "Search",
  className = "",
  disabled = false,
  showIcon = true,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <Field orientation="horizontal" className="relative">
        <div className="relative flex-1">
          {showIcon && (
            <IconSearch className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          )}
          <Input
            type="search"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={`w-full ${showIcon ? "pl-9" : "pl-3"} pr-8 text-xs h-9 bg-background/80 border-border/80 focus-visible:border-primary/50`}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange?.("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={disabled}
          className="h-9 px-3.5 text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
        >
          {buttonText}
        </Button>
      </Field>
    </form>
  );
}
