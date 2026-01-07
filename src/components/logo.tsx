import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <div className="absolute h-5 w-5 rounded-full bg-background"></div>
        <div className="absolute h-4 w-4 text-center font-bold text-primary">8</div>
      </div>
      <span className="font-headline text-xl font-bold">Cue Controller</span>
    </div>
  );
}
