import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  icon: LucideIcon;
  accent?: "primary" | "secondary";
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">—</p>
          <p className="mt-1 text-xs text-muted-foreground">Próximamente</p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            accent === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary-hover",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
