"use client";

import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ArogyaIcon } from "@/components/ArogyaIcon";
import { HealthTopics } from "@/components/HealthTopics";
import { PublicHealthAlerts } from "@/components/PublicHealthAlerts";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Chat } from "@/components/Chat";
import { ChatHistoryList } from "@/components/ChatHistoryList";
import { useAuth } from "@/components/AuthProvider";
import { AuthModal } from "@/components/AuthModal";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, ChevronDown, ShieldAlert } from "lucide-react";
import { AdminDashboardModal } from "@/components/AdminDashboardModal";

export default function Home() {
  const { user, logout, isAdmin } = useAuth();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border/40 py-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <ArogyaIcon className="w-7 h-7 text-primary" />
              <span className="text-lg font-headline font-semibold tracking-tight">Arogya AI</span>
            </div>
          </div>
          <div className="px-2 mt-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between items-center px-2 py-1.5 h-10 border border-sidebar-border bg-sidebar-accent/20 hover:bg-sidebar-accent/50 rounded-xl">
                    <div className="flex items-center gap-2 text-left truncate">
                      <Avatar className="w-6 h-6 border">
                        <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground uppercase">
                          {user.username.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate flex flex-col">
                        <span className="text-xs font-semibold leading-none">{user.username}</span>
                        {user.email && <span className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email}</span>}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => setIsAdminOpen(true)} className="cursor-pointer gap-2 font-semibold text-destructive focus:text-destructive">
                        <ShieldAlert className="w-4 h-4" />
                        Admin Console
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer gap-2">
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <AuthModal 
                trigger={
                  <Button variant="outline" className="w-full h-9 bg-sidebar-accent/50 hover:bg-sidebar-accent text-xs font-medium border-sidebar-border rounded-xl gap-1.5 justify-center">
                    <LogIn className="w-3.5 h-3.5 text-primary" />
                    Sign In / Register
                  </Button>
                }
              />
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ChatHistoryList />
          <HealthTopics />
          <PublicHealthAlerts />
        </SidebarContent>
        <SidebarFooter>
          <LanguageSelector />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex items-center justify-between p-2 border-b md:hidden">
          <div className="flex items-center gap-2">
            <ArogyaIcon className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-semibold">Arogya AI</h1>
          </div>
          <SidebarTrigger />
        </header>
        <div className="flex-1 overflow-y-auto">
          <Chat />
        </div>
      </SidebarInset>
      <AdminDashboardModal isOpen={isAdminOpen} onOpenChange={setIsAdminOpen} />
    </SidebarProvider>
  );
}
