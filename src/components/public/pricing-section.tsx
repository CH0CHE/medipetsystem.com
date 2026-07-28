"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MarketingPlan } from "@/modules/content/domain/entities";

const currency = (n: number) => `Q${n.toFixed(0)}`;

export function PricingSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: async () => {
      const res = await fetch("/api/public/plans");
      if (!res.ok) throw new Error("No se pudieron cargar los planes.");
      return (await res.json()) as { plans: MarketingPlan[] };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {data?.plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn("flex flex-col", plan.highlighted && "border-secondary shadow-lg ring-1 ring-secondary/30")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              {plan.highlighted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary-hover">
                  <Star className="size-3" /> Más popular
                </span>
              )}
            </div>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <p className="text-4xl font-semibold text-foreground">
              {currency(plan.price)}
              <span className="text-sm font-normal text-muted-foreground"> / {plan.billingPeriod}</span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-secondary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant={plan.highlighted ? "default" : "outline"}>
              <Link href="/demo">Solicitar demo</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
