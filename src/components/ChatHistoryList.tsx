"use client";

import { useAuth } from "./AuthProvider";
import { MessageSquare, Trash2, Plus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { AuthModal } from "./AuthModal";

export function ChatHistoryList() {
  const { 
    sessions, 
    activeSessionId, 
    setActiveSessionId, 
    createNewSession, 
    deleteSession, 
    user 
  } = useAuth();

  return (
    <SidebarGroup className="py-2">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <SidebarGroupLabel className="flex items-center gap-2 p-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
          <MessageSquare className="w-4 h-4" />
          Recent Chats
        </SidebarGroupLabel>
        <Button
          onClick={createNewSession}
          variant="ghost"
          size="icon"
          className="w-7 h-7 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground rounded-lg"
          title="New Conversation"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <SidebarMenu className="space-y-0.5 max-h-[220px] overflow-y-auto px-1 scrollbar-thin">
        {sessions.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground italic">
            No active conversations
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <SidebarMenuItem key={session.id}>
                <div className="group relative flex items-center w-full rounded-lg transition-colors overflow-hidden">
                  <SidebarMenuButton
                    onClick={() => setActiveSessionId(session.id)}
                    className={`flex-1 pr-8 text-left text-sm py-1.5 h-8 justify-start font-normal truncate rounded-lg ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="truncate">{session.title}</span>
                  </SidebarMenuButton>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                    className="absolute right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded transition-opacity duration-150"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </SidebarMenuItem>
            );
          })
        )}
      </SidebarMenu>

      {!user && (
        <div className="mt-3 mx-2 p-2.5 rounded-xl border border-dashed border-sidebar-border bg-sidebar-accent/35 text-center space-y-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Sign up or log in to sync and save your chat history permanently.
          </p>
          <AuthModal 
            trigger={
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-7 bg-background hover:bg-sidebar-accent font-medium shadow-none gap-1"
              >
                <LogIn className="w-3 h-3" />
                Log In
              </Button>
            }
          />
        </div>
      )}
    </SidebarGroup>
  );
}
