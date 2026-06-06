"use client";

import { useState, useRef, useEffect } from "react";
import { SendHorizonal, LoaderCircle, Mic, MicOff, Volume2, VolumeX, SlidersHorizontal, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMessage } from "./UserMessage";
import { BotMessage } from "./BotMessage";
import { getAIResponse } from "@/app/actions";
import { useLanguage } from "./LanguageProvider";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Message = {
  id: number;
  role: "user" | "bot";
  content: string;
  image?: string;
};

export function Chat() {
  const { 
    user, 
    activeSession, 
    addMessageToActiveSession,
    voiceRate,
    voicePitch,
    voiceName,
    changeRate,
    changePitch,
    changeVoiceName,
    speak
  } = useAuth();
  
  const messages = activeSession?.messages || [];
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechErrorToastShownRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onstart = () => {
          setIsListening(true);
        };
        
        rec.onend = () => {
          setIsListening(false);
        };
        
        rec.onerror = (e: any) => {
          const errorCode = e?.error ?? "unknown";
          const errorMessages: Record<string, { title: string; description: string }> = {
            "not-allowed": {
              title: "Microphone permission needed",
              description: "Allow microphone access in your browser, then try voice typing again.",
            },
            "service-not-allowed": {
              title: "Voice typing blocked",
              description: "This browser has blocked speech recognition. Try Chrome or Edge with microphone access enabled.",
            },
            "audio-capture": {
              title: "No microphone found",
              description: "Connect or enable a microphone, then try again.",
            },
            "no-speech": {
              title: "No speech detected",
              description: "Please try again and speak clearly after tapping the microphone.",
            },
            network: {
              title: "Voice service unavailable",
              description: "Speech recognition could not connect. Check your connection and try again.",
            },
          };

          if (errorCode !== "aborted" && !speechErrorToastShownRef.current) {
            speechErrorToastShownRef.current = true;
            const message = errorMessages[errorCode] ?? {
              title: "Voice typing stopped",
              description: "Speech recognition could not start. Please try again or type your question.",
            };
            toast({
              ...message,
              variant: "destructive",
            });
          }
          setIsListening(false);
        };
        
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        
        recognitionRef.current = rec;
        setIsSpeechRecognitionSupported(true);
      } else {
        setIsSpeechRecognitionSupported(false);
      }

      // Load Speech Synthesis Voices
      if (window.speechSynthesis) {
        const loadVoices = () => {
          setAvailableVoices(window.speechSynthesis.getVoices());
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
      }
    }

    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        // Speech recognition cleanup should never block unmount.
      }
    };
  }, [toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Typing Unavailable",
        description: "Your browser does not support Speech Recognition. Please try using Google Chrome or Microsoft Edge.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      try {
        speechErrorToastShownRef.current = false;
        recognitionRef.current.stop();
      } catch {
        setIsListening(false);
      }
    } else {
      // Set language dynamically
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-US";
      try {
        speechErrorToastShownRef.current = false;
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
        toast({
          title: "Voice typing could not start",
          description: "Please wait a moment and try again, or type your question.",
          variant: "destructive",
        });
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      // Limit to 3MB for optimal transit and storage
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 3MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const query = input;
    const imgData = selectedImage || undefined;
    
    // Add user message to session (with image if available)
    addMessageToActiveSession("user", query, imgData);
    
    // Reset states
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await getAIResponse(query, language, user?.username, imgData);
      addMessageToActiveSession("bot", response);
      if (autoSpeak) {
        let speechText = response;
        try {
          if (response.trim().startsWith("{")) {
            const parsed = JSON.parse(response);
            speechText = parsed.answer || "";
            if (parsed.symptoms) speechText += `\nSymptoms: ${parsed.symptoms}`;
            if (parsed.precautions) speechText += `\nPrecautions: ${parsed.precautions}`;
            if (parsed.whenToMeetDoctor) speechText += `\nWhen to meet a doctor: ${parsed.whenToMeetDoctor}`;
            if (parsed.homeRemedies) speechText += `\nHome remedies: ${parsed.homeRemedies}`;
          }
        } catch (e) {
          // ignore
        }
        speak(speechText, language);
      }
    } catch (error) {
      addMessageToActiveSession(
        "bot",
        JSON.stringify({
          answer: "Sorry, I'm having trouble connecting. Please try again later."
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available voices based on current active language
  const currentLangCode = (language === "hi" || language === "bho") ? "hi" : language === "mr" ? "mr" : "en";
  const filteredVoices = availableVoices.filter((v) => 
    v.lang.toLowerCase().startsWith(currentLangCode)
  );

  return (
    <div className="flex flex-col h-full max-h-[calc(100svh-4rem)] md:max-h-full">
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-foreground/60">
            <h2 className="text-2xl font-bold font-headline">Welcome to Arogya AI</h2>
            <p className="max-w-md">
              Ask me any health-related question. I can provide information about symptoms, prevention, and more.
            </p>
            <p className="text-xs mt-4">For example: "What are the symptoms of dengue?"</p>
          </div>
        ) : (
          messages.map((message) =>
            message.role === "user" ? (
              <UserMessage key={message.id} image={message.image}>{message.content}</UserMessage>
            ) : (
              <BotMessage key={message.id}>{message.content}</BotMessage>
            )
          )
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-foreground/60">
             <LoaderCircle className="w-5 h-5 animate-spin text-primary" />
             <span>Arogya AI is thinking...</span>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-background/80 backdrop-blur-sm border-t space-y-2">
        {/* Image upload thumbnail preview */}
        {selectedImage && (
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group shrink-0 bg-muted/20 animate-in fade-in zoom-in-95 duration-150">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-1 right-1 bg-black/75 hover:bg-black/90 text-white p-0.5 rounded-full shadow transition-colors"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File Input element (hidden) */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Auto Speak Toggle */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`w-9 h-9 border-border shrink-0 rounded-xl transition-all ${
              autoSpeak 
                ? "bg-primary/10 border-primary text-primary hover:bg-primary/20 hover:text-primary" 
                : "text-muted-foreground hover:bg-muted"
            }`}
            title={autoSpeak ? "Auto-Speak: Enabled" : "Auto-Speak: Disabled"}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Voice Settings Config Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="w-9 h-9 border-border shrink-0 rounded-xl text-muted-foreground hover:bg-muted"
                title="Voice Settings"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-4 rounded-2xl bg-background/95 border-border backdrop-blur-md shadow-xl space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold text-xs leading-none">Voice Settings</h4>
                <p className="text-[10px] text-muted-foreground">Adjust voice format and playback style.</p>
              </div>
              
              {/* Voice Choice Select */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">Voice Engine</label>
                <Select 
                  value={voiceName || "_default_"} 
                  onValueChange={(val) => changeVoiceName(val === "_default_" ? "" : val)}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-muted/30 border-border rounded-lg">
                    <SelectValue placeholder="System Default Voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-40 rounded-xl">
                    <SelectItem value="_default_">System Default</SelectItem>
                    {filteredVoices.map((v) => (
                      <SelectItem key={v.name} value={v.name} className="text-xs">
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span>Reading Speed</span>
                  <span className="font-mono lowercase text-muted-foreground font-normal">{voiceRate.toFixed(1)}x</span>
                </div>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[voiceRate]}
                  onValueChange={(val) => changeRate(val[0])}
                  className="py-1 cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span>Voice Pitch</span>
                  <span className="font-mono text-muted-foreground font-normal">{voicePitch.toFixed(1)}</span>
                </div>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[voicePitch]}
                  onValueChange={(val) => changePitch(val[0])}
                  className="py-1 cursor-pointer"
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Photo Search/Upload Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleImageClick}
            className={`w-9 h-9 border-border shrink-0 rounded-xl text-muted-foreground hover:bg-muted transition-all ${
              selectedImage ? "border-primary text-primary bg-primary/10" : ""
            }`}
            title="Upload photo for disease analysis"
            disabled={isLoading || isListening}
          >
            <Image className="w-4 h-4" />
          </Button>

          {/* Text Input */}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening... Speak now..." : "Ask a question or upload a symptom photo..."}
            className={`flex-1 rounded-xl border-border transition-all ${
              isListening 
                ? "border-red-500/50 bg-red-500/5 text-red-500 animate-pulse placeholder:text-red-400" 
                : ""
            }`}
            disabled={isLoading || isListening}
            aria-label="Chat input"
          />

          {/* Voice input Microphone trigger */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleListening}
            className={`w-9 h-9 border-border shrink-0 rounded-xl transition-all ${
              isListening 
                ? "bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20 hover:text-red-500" 
                : "text-muted-foreground hover:bg-muted"
            }`}
            title={isListening ? "Stop Voice Typing" : "Voice Typing"}
            disabled={isLoading || !isSpeechRecognitionSupported}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          {/* Send Button */}
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || (!input.trim() && !selectedImage) || isListening} 
            variant="default" 
            className="bg-primary hover:bg-primary/90 rounded-xl shrink-0"
          >
            <SendHorizonal className="w-5 h-5" />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
         <p className="text-xs text-center text-foreground/50 mt-1">
            Arogya Mitra is an AI assistant and may produce inaccurate information. Consult a medical professional for advice.
        </p>
      </div>
    </div>
  );
}
