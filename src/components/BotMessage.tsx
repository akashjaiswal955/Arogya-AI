"use client";

import { Bot, Volume2, VolumeX, Activity, ShieldCheck, Stethoscope, HeartHandshake } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "./LanguageProvider";
import { useAuth } from "./AuthProvider";
import { useState } from "react";

type BotMessageProps = {
  children: React.ReactNode;
};

export function BotMessage({ children }: BotMessageProps) {
  const { language } = useLanguage();
  const { speak, stopSpeaking, isSpeakingGlobal } = useAuth();
  const [isPlayingLocally, setIsPlayingLocally] = useState(false);

  const text = typeof children === "string" ? children : "";

  // Try to parse the content as JSON for structured answers
  let parsed: {
    answer: string;
    symptoms?: string;
    precautions?: string;
    whenToMeetDoctor?: string;
    homeRemedies?: string;
  } | null = null;

  try {
    if (text.trim().startsWith("{")) {
      parsed = JSON.parse(text);
    }
  } catch (e) {
    // Not JSON
  }

  // Build clean speech text
  let speechText = "";
  if (parsed) {
    speechText = parsed.answer || "";
    if (parsed.symptoms) speechText += `\nSymptoms: ${parsed.symptoms}`;
    if (parsed.precautions) speechText += `\nPrecautions: ${parsed.precautions}`;
    if (parsed.whenToMeetDoctor) speechText += `\nWhen to meet a doctor: ${parsed.whenToMeetDoctor}`;
    if (parsed.homeRemedies) speechText += `\nHome remedies: ${parsed.homeRemedies}`;
  } else {
    speechText = text;
  }

  const handleSpeak = () => {
    if (isPlayingLocally && isSpeakingGlobal) {
      stopSpeaking();
      setIsPlayingLocally(false);
      return;
    }

    if (!speechText) return;

    setIsPlayingLocally(true);
    speak(speechText, language, () => {
      setIsPlayingLocally(false);
    });
  };

  const activePlaying = isPlayingLocally && isSpeakingGlobal;
  const hasColumns = parsed && (parsed.symptoms || parsed.precautions || parsed.whenToMeetDoctor || parsed.homeRemedies);

  return (
    <div className="flex items-start gap-3 w-full">
      <Avatar className="w-8 h-8 border-2 border-primary/50 shrink-0">
        <AvatarFallback className="bg-primary/20 text-primary">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      
      <div className={`w-full transition-all duration-300 ${hasColumns ? "max-w-4xl" : "max-w-lg"}`}>
        <Card className="bg-card text-card-foreground shadow-md rounded-2xl rounded-tl-none border-border">
          <CardContent className="p-4 relative group/msg space-y-3">
            {parsed ? (
              <div className="space-y-4">
                {parsed.answer && <div className="text-sm leading-relaxed pr-8 whitespace-pre-line">{parsed.answer}</div>}
                
                {hasColumns && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3 border-t pt-3 border-border/50">
                    {parsed.symptoms && (
                      <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2 flex flex-col">
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider">
                          <Activity className="w-3.5 h-3.5" />
                          Symptoms
                        </div>
                        <div className="text-xs text-foreground/80 space-y-1 pl-1 whitespace-pre-line flex-1 leading-relaxed">
                          {parsed.symptoms}
                        </div>
                      </div>
                    )}

                    {parsed.precautions && (
                      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2 flex flex-col">
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Precautions
                        </div>
                        <div className="text-xs text-foreground/80 space-y-1 pl-1 whitespace-pre-line flex-1 leading-relaxed">
                          {parsed.precautions}
                        </div>
                      </div>
                    )}

                    {parsed.whenToMeetDoctor && (
                      <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-2 flex flex-col">
                        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold text-[10px] uppercase tracking-wider">
                          <Stethoscope className="w-3.5 h-3.5" />
                          Meet Doctor
                        </div>
                        <div className="text-xs text-foreground/80 space-y-1 pl-1 whitespace-pre-line flex-1 leading-relaxed">
                          {parsed.whenToMeetDoctor}
                        </div>
                      </div>
                    )}

                    {parsed.homeRemedies && (
                      <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl space-y-2 flex flex-col">
                        <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold text-[10px] uppercase tracking-wider">
                          <HeartHandshake className="w-3.5 h-3.5" />
                          Home Remedies
                        </div>
                        <div className="text-xs text-foreground/80 space-y-1 pl-1 whitespace-pre-line flex-1 leading-relaxed">
                          {parsed.homeRemedies}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="pr-7 text-sm whitespace-pre-line leading-relaxed">{children}</div>
            )}
            
            {text && (
              <button
                onClick={handleSpeak}
                className="absolute right-3 top-3 p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                title={activePlaying ? "Stop Speaking" : "Read Aloud"}
              >
                {activePlaying ? (
                  <VolumeX className="w-3.5 h-3.5 text-primary animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                )}
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
