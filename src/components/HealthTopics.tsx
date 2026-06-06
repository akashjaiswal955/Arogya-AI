"use client";

import { Stethoscope } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { healthTopics } from "@/lib/data";
import { useLanguage } from "./LanguageProvider";

export function HealthTopics() {
  const { language } = useLanguage();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <Stethoscope />
        Health Topics
      </SidebarGroupLabel>
      <Accordion type="single" collapsible className="w-full">
        {healthTopics.map((topic) => (
          <AccordionItem value={topic.topicId} key={topic.topicId}>
            <AccordionTrigger className="text-sm hover:no-underline">
              {topic[language].title}
            </AccordionTrigger>
            <AccordionContent className="text-xs text-sidebar-foreground/80 space-y-2">
              <div>
                <h4 className="font-semibold">Symptoms:</h4>
                <p>{topic[language].symptoms}</p>
              </div>
              <div>
                <h4 className="font-semibold">Prevention:</h4>
                <p>{topic[language].prevention}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SidebarGroup>
  );
}
