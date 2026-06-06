"use client";

import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLanguage, type Language } from "./LanguageProvider";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleValueChange = (value: string) => {
    setLanguage(value as Language);
  };

  return (
    <div className="p-2 space-y-2">
      <Label className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-2">
        <Languages className="w-4 h-4" />
        Language
      </Label>
      <Select value={language} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full bg-sidebar-accent border-sidebar-border h-9">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="mr">मराठी (Marathi)</SelectItem>
          <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
          <SelectItem value="bho">भोजपुरी (Bhojpuri)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
