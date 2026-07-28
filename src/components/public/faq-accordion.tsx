"use client";

import { useQuery } from "@tanstack/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { FaqItem } from "@/modules/content/domain/entities";

export function FaqAccordion({ limit }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "faqs"],
    queryFn: async () => {
      const res = await fetch("/api/public/faqs");
      if (!res.ok) throw new Error("No se pudieron cargar las preguntas frecuentes.");
      return (await res.json()) as { faqs: FaqItem[] };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit ?? 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const faqs = limit ? (data?.faqs ?? []).slice(0, limit) : (data?.faqs ?? []);

  if (faqs.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay preguntas frecuentes publicadas.</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
