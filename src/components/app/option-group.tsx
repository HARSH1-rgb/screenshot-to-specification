import { useId } from "react";

import { cn } from "@/lib/utils";

/** Accessible radio group rendered as selectable tiles. */
export function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns = "sm:grid-cols-4",
  describe,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  columns?: string;
  describe?: (v: T) => string | undefined;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      <div className={cn("grid grid-cols-2 gap-2", columns)}>
        {options.map((opt) => {
          const checked = opt === value;
          const hint = describe?.(opt);
          return (
            <label
              key={String(opt)}
              className={cn(
                "cursor-pointer rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked ? "border-primary bg-primary-soft text-accent-foreground" : "border-border hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                onChange={() => onChange(opt)}
              />
              <span className="font-medium">{opt}</span>
              {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
