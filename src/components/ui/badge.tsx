import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}
