"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserMessageProps = {
  children: React.ReactNode;
  image?: string;
};

export function UserMessage({ children, image }: UserMessageProps) {
  return (
    <div className="flex justify-end items-start gap-3">
      <div className="max-w-lg w-fit">
        <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none shadow-md space-y-2">
          {image && (
            <div className="max-h-48 rounded-lg overflow-hidden border border-primary-foreground/20 bg-black/10">
              <img 
                src={image} 
                alt="Uploaded symptom" 
                className="w-full max-h-44 object-contain rounded" 
              />
            </div>
          )}
          <p className="text-sm">{children}</p>
        </div>
      </div>
       <Avatar className="w-8 h-8">
        <AvatarFallback>
          <User className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
