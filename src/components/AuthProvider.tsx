"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { getDatabaseUsers, loginWithDatabase, registerWithDatabase } from "@/lib/auth-api";

export type Message = {
  id: number;
  role: "user" | "bot";
  content: string;
  image?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

export type User = {
  username: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setActiveSessionId: (id: string | null) => void;
  createNewSession: () => string;
  deleteSession: (id: string) => void;
  addMessageToActiveSession: (role: "user" | "bot", content: string, image?: string) => void;
  activeSession: ChatSession | null;
  clearHistory: () => void;
  isAdmin: boolean;
  getAllUsersData: () => Promise<any[]>;
  voiceRate: number;
  voicePitch: number;
  voiceName: string;
  isSpeakingGlobal: boolean;
  changeRate: (rate: number) => void;
  changePitch: (pitch: number) => void;
  changeVoiceName: (name: string) => void;
  speak: (text: string, currentLang: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load sessions based on current logged in user (or guest)
  const getStorageKey = (currentUser: User | null) => {
    return currentUser ? `arogya_sessions_${currentUser.email || currentUser.username}` : "arogya_sessions_guest";
  };

  // 1. Initial load of user from localStorage
  useEffect(() => {
    try {
      const activeUserStr = localStorage.getItem("arogya_active_user");
      if (activeUserStr) {
        const loggedInUser = JSON.parse(activeUserStr) as User;
        setUser(loggedInUser);
        
        // Load sessions for this user
        const savedSessions = localStorage.getItem(`arogya_sessions_${loggedInUser.email || loggedInUser.username}`);
        if (savedSessions) {
          const parsed = JSON.parse(savedSessions) as ChatSession[];
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          }
        }
      } else {
        // Load guest sessions
        const guestSessions = localStorage.getItem("arogya_sessions_guest");
        if (guestSessions) {
          const parsed = JSON.parse(guestSessions) as ChatSession[];
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Error reading localStorage on mount", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Persist sessions to localStorage whenever they change
  useEffect(() => {
    if (isLoading) return;
    try {
      const key = getStorageKey(user);
      localStorage.setItem(key, JSON.stringify(sessions));
    } catch (e) {
      console.error("Error persisting sessions to localStorage", e);
    }
  }, [sessions, user, isLoading]);

  // Find active session helper
  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Create a new session helper
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  // Ensure there is always at least one session on login/logout if empty
  useEffect(() => {
    if (isLoading) return;
    if (sessions.length === 0) {
      createNewSession();
    } else if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId, isLoading]);

  // Handle User Login
  const login = async (emailOrUsername: string, password: string) => {
    const response = await loginWithDatabase(emailOrUsername, password);
    if (!response.success || !response.user) {
      return { success: false, message: response.message || "Invalid username/email or password" };
    }

    const loggedInUser: User = response.user;

    // Load user sessions
    const userSessionsKey = `arogya_sessions_${loggedInUser.email || loggedInUser.username}`;
    const userSavedSessions = localStorage.getItem(userSessionsKey);
    let userSessionsList: ChatSession[] = userSavedSessions ? JSON.parse(userSavedSessions) : [];

    // Migrate guest session if there is active context in guest
    const guestSessionsKey = "arogya_sessions_guest";
    const guestSessionsStr = localStorage.getItem(guestSessionsKey);
    const guestSessions: ChatSession[] = guestSessionsStr ? JSON.parse(guestSessionsStr) : [];
    
    // Filter guest sessions that have messages
    const activeGuestSessions = guestSessions.filter(s => s.messages.length > 0);
    if (activeGuestSessions.length > 0) {
      // Add guest chats to user's history, preventing duplicates
      const mergedSessions = [...activeGuestSessions, ...userSessionsList];
      // Keep only unique session IDs
      const uniqueSessions = mergedSessions.filter(
        (s, idx, self) => self.findIndex((t) => t.id === s.id) === idx
      );
      userSessionsList = uniqueSessions;
      // Clear guest sessions
      localStorage.setItem(guestSessionsKey, JSON.stringify([]));
    }

    // Save and Set State
    localStorage.setItem("arogya_active_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setSessions(userSessionsList);
    
    if (userSessionsList.length > 0) {
      setActiveSessionId(userSessionsList[0].id);
    } else {
      // Will be handled by the empty-session useEffect
      setActiveSessionId(null);
    }

    return { success: true, message: "Logged in successfully!" };
  };

  // Handle User Registration
  const register = async (username: string, password: string) => {
    const response = await registerWithDatabase(username, password);
    if (!response.success || !response.user) {
      return { success: false, message: response.message || "Registration failed" };
    }

    const loggedInUser: User = response.user;

    // Migrate any active guest sessions
    const guestSessionsKey = "arogya_sessions_guest";
    const guestSessionsStr = localStorage.getItem(guestSessionsKey);
    const guestSessions: ChatSession[] = guestSessionsStr ? JSON.parse(guestSessionsStr) : [];
    const activeGuestSessions = guestSessions.filter(s => s.messages.length > 0);

    localStorage.setItem("arogya_active_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    if (activeGuestSessions.length > 0) {
      setSessions(activeGuestSessions);
      setActiveSessionId(activeGuestSessions[0].id);
      // Clear guest sessions
      localStorage.setItem(guestSessionsKey, JSON.stringify([]));
    } else {
      setSessions([]);
      setActiveSessionId(null);
    }

    return { success: true, message: "Account created successfully!" };
  };

  // Handle User Logout
  const logout = () => {
    localStorage.removeItem("arogya_active_user");
    setUser(null);
    
    // Load guest sessions
    const guestSessionsStr = localStorage.getItem("arogya_sessions_guest");
    const guestSessions: ChatSession[] = guestSessionsStr ? JSON.parse(guestSessionsStr) : [];
    setSessions(guestSessions);
    if (guestSessions.length > 0) {
      setActiveSessionId(guestSessions[0].id);
    } else {
      setActiveSessionId(null);
    }
  };

  // Delete a session
  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        if (filtered.length > 0) {
          setActiveSessionId(filtered[0].id);
        } else {
          setActiveSessionId(null);
        }
      }
      return filtered;
    });
  };

  // Add message to active session
  const addMessageToActiveSession = (role: "user" | "bot", content: string, image?: string) => {
    setSessions((prev) => {
      // Find the current active session
      let targetSessionId = activeSessionId;
      let sessionsCopy = [...prev];

      // If no active session, create one
      if (!targetSessionId || sessionsCopy.length === 0) {
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: "New Conversation",
          messages: [],
          createdAt: new Date().toISOString(),
        };
        sessionsCopy = [newSession, ...sessionsCopy];
        targetSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      }

      return sessionsCopy.map((session) => {
        if (session.id === targetSessionId) {
          const newMessage: Message = {
            id: Date.now() + (role === "bot" ? 1 : 0),
            role,
            content,
            image,
          };
          const updatedMessages = [...session.messages, newMessage];
          
          // Generate an elegant, smart title if this is the first user message
          let newTitle = session.title;
          if (session.title === "New Conversation" && role === "user") {
            newTitle = content.length > 30 ? content.substring(0, 30) + "..." : content;
          }

          return {
            ...session,
            title: newTitle,
            messages: updatedMessages,
          };
        }
        return session;
      });
    });
  };

  // Clear all history
  const clearHistory = () => {
    setSessions([]);
    setActiveSessionId(null);
  };

  // Admin capabilities
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return (user.email && user.email.toLowerCase() === "admin@arogya.ai") || user.username.toLowerCase() === "admin";
  }, [user]);

  const getAllUsersData = async () => {
    try {
      const usersList = await getDatabaseUsers();
      return usersList.map((u: any) => {
        const userSessionsKey = `arogya_sessions_${u.email || u.username}`;
        const userSavedSessions = localStorage.getItem(userSessionsKey);
        const userSessions = userSavedSessions ? JSON.parse(userSavedSessions) : [];
        return {
          username: u.username,
          email: u.email,
          createdAt: u.createdAt,
          sessions: userSessions,
        };
      });
    } catch (e) {
      console.error("Error reading admin data", e);
      return [];
    }
  };

  const [voiceRate, setVoiceRate] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);
  const [voiceName, setVoiceName] = useState("");
  const [isSpeakingGlobal, setIsSpeakingGlobal] = useState(false);

  useEffect(() => {
    const rate = localStorage.getItem("arogya_voice_rate");
    const pitch = localStorage.getItem("arogya_voice_pitch");
    const name = localStorage.getItem("arogya_voice_name");
    if (rate) setVoiceRate(parseFloat(rate));
    if (pitch) setVoicePitch(parseFloat(pitch));
    if (name) setVoiceName(name);
  }, []);

  const changeRate = (rate: number) => {
    setVoiceRate(rate);
    localStorage.setItem("arogya_voice_rate", rate.toString());
  };

  const changePitch = (pitch: number) => {
    setVoicePitch(pitch);
    localStorage.setItem("arogya_voice_pitch", pitch.toString());
  };

  const changeVoiceName = (name: string) => {
    setVoiceName(name);
    localStorage.setItem("arogya_voice_name", name);
  };

  const speak = (text: string, currentLang: string, onEndCallback?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    setIsSpeakingGlobal(false);

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find((v) => v.name === voiceName);

    const requiredLang = (currentLang === "hi" || currentLang === "bho") ? "hi-IN" : currentLang === "mr" ? "mr-IN" : "en-US";
    
    if (!selectedVoice || !selectedVoice.lang.includes(requiredLang.substring(0, 2))) {
      selectedVoice = voices.find((v) => v.lang.includes(requiredLang) || v.lang.includes(requiredLang.substring(0, 2)));
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = requiredLang;
    }

    utterance.onstart = () => setIsSpeakingGlobal(true);
    
    const endHandler = () => {
      setIsSpeakingGlobal(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onend = endHandler;
    utterance.onerror = endHandler;

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingGlobal(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      sessions,
      activeSessionId,
      isLoading,
      login,
      register,
      logout,
      setActiveSessionId,
      createNewSession,
      deleteSession,
      addMessageToActiveSession,
      activeSession,
      clearHistory,
      isAdmin,
      getAllUsersData,
      voiceRate,
      voicePitch,
      voiceName,
      isSpeakingGlobal,
      changeRate,
      changePitch,
      changeVoiceName,
      speak,
      stopSpeaking,
    }),
    [
      user, 
      sessions, 
      activeSessionId, 
      isLoading, 
      activeSession, 
      isAdmin,
      voiceRate,
      voicePitch,
      voiceName,
      isSpeakingGlobal
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
