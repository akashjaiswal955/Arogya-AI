"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShieldAlert, 
  Users, 
  MessageSquareCode, 
  Download, 
  Calendar, 
  ChevronRight, 
  MessageCircle, 
  Search,
  ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDashboardModal({ isOpen, onOpenChange }: AdminDashboardModalProps) {
  const { getAllUsersData } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [usersData, setUsersData] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Refresh data whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      getAllUsersData().then((data) => {
        setUsersData(data);
        if (data.length > 0) {
          setSelectedUserEmail(data[0].email || data[0].username);
        }
      });
    }
  }, [isOpen]);

  // Selected User Object
  const selectedUser = usersData.find((u) => (u.email || u.username) === selectedUserEmail) || null;

  // Selected Session Object
  const selectedSession = selectedUser?.sessions.find((s: any) => s.id === selectedSessionId) || null;

  // Set default session if user changes
  useEffect(() => {
    if (selectedUser) {
      if (selectedUser.sessions.length > 0) {
        setSelectedSessionId(selectedUser.sessions[0].id);
      } else {
        setSelectedSessionId(null);
      }
    }
  }, [selectedUserEmail]);

  // Metrics Calculation
  const totalUsers = usersData.length;
  const totalSessions = usersData.reduce((acc, u) => acc + u.sessions.length, 0);
  const totalMessages = usersData.reduce(
    (acc, u) => acc + u.sessions.reduce((sAcc: number, s: any) => sAcc + s.messages.length, 0),
    0
  );

  // Filtered Users List
  const filteredUsers = usersData.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Download all user data in JSON format
  const handleExportJSON = () => {
    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(usersData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `arogya_users_investigation_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] md:max-w-5xl max-h-[85vh] overflow-hidden bg-background/95 border-border backdrop-blur-md p-6 rounded-2xl shadow-2xl flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 space-y-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline">Admin Investigation Console</DialogTitle>
              <DialogDescription className="text-xs">
                Inspect user chat history logs and retrieve diagnostics.
              </DialogDescription>
            </div>
          </div>
          <Button 
            onClick={handleExportJSON} 
            size="sm" 
            variant="outline" 
            className="text-xs font-semibold gap-1.5 border-border"
          >
            <Download className="w-3.5 h-3.5" />
            Export Diagnostic JSON
          </Button>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 my-4">
          <Card className="bg-sidebar-accent/15 border-sidebar-border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Registered Users</p>
                <h3 className="text-lg font-bold">{totalUsers}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-sidebar-accent/15 border-sidebar-border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                <MessageSquareCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Sessions</p>
                <h3 className="text-lg font-bold">{totalSessions}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-sidebar-accent/15 border-sidebar-border shadow-none">
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Total Logged Messages</p>
                <h3 className="text-lg font-bold">{totalMessages}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Panel Content */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* User selector column */}
          <div className="md:col-span-4 border border-border rounded-xl flex flex-col overflow-hidden bg-muted/20">
            <div className="p-2 border-b bg-muted/40 relative">
              <Search className="absolute left-4 top-4 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 border-border shadow-none focus-visible:ring-0"
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    No users found
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.email || u.username}
                      onClick={() => setSelectedUserEmail(u.email || u.username)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        (u.email || u.username) === selectedUserEmail
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted text-foreground/90"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold truncate">{u.username}</p>
                        {u.email && (
                          <p className={`text-[10px] truncate ${u.email === selectedUserEmail ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {u.email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className={`text-[9px] px-1 h-4 border-none ${
                          (u.email || u.username) === selectedUserEmail ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"
                        }`}>
                          {u.sessions.length} chats
                        </Badge>
                        <ChevronRight className="w-3.5 h-3.5 opacity-55" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* User details & messages column */}
          <div className="md:col-span-8 border border-border rounded-xl flex flex-col overflow-hidden bg-muted/5">
            {selectedUser ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Selected User Header */}
                <div className="p-3 border-b bg-muted/20 flex justify-between items-center shrink-0">
                  <div>
                    <h4 className="text-sm font-semibold">{selectedUser.username}</h4>
                    {selectedUser.email && <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Joined: {new Date(selectedUser.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                {/* Session select & Chat transcript */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
                  {/* Sessions column */}
                  <div className="md:col-span-4 border-r border-border flex flex-col min-h-0">
                    <div className="px-3 py-1.5 bg-muted/10 border-b text-[10px] font-semibold text-muted-foreground uppercase">
                      Select Session
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {selectedUser.sessions.length === 0 ? (
                          <div className="text-center text-xs text-muted-foreground py-6 italic">
                            No chat sessions
                          </div>
                        ) : (
                          selectedUser.sessions.map((s: any) => (
                            <button
                              key={s.id}
                              onClick={() => setSelectedSessionId(s.id)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors truncate ${
                                s.id === selectedSessionId
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                  : "hover:bg-muted text-foreground/80"
                              }`}
                            >
                              <div className="truncate pr-1">
                                <p className="font-medium truncate">{s.title}</p>
                                <p className="text-[9px] text-muted-foreground">
                                  {new Date(parseInt(s.id)).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className="text-[9px] h-4 bg-muted text-muted-foreground hover:bg-muted font-normal px-1 shadow-none border-none shrink-0">
                                {s.messages.length} msg
                              </Badge>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Transcript column */}
                  <div className="md:col-span-8 flex flex-col min-h-0 bg-background/50">
                    <div className="px-3 py-1.5 bg-muted/10 border-b text-[10px] font-semibold text-muted-foreground uppercase shrink-0">
                      Message Transcript
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-3 space-y-3">
                        {!selectedSession || selectedSession.messages.length === 0 ? (
                          <div className="text-center text-xs text-muted-foreground py-16 italic">
                            Select a session or no messages in transcript
                          </div>
                        ) : (
                          selectedSession.messages.map((m: any, idx: number) => {
                            const isUser = m.role === "user";
                            return (
                              <div
                                key={m.id || idx}
                                className={`flex flex-col space-y-1 max-w-[85%] ${
                                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                                }`}
                              >
                                <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                                  {isUser ? selectedUser.username : "Arogya AI"}
                                </span>
                                <div
                                  className={`p-2.5 rounded-2xl text-xs ${
                                    isUser
                                      ? "bg-primary text-primary-foreground rounded-tr-none"
                                      : "bg-sidebar-accent text-sidebar-accent-foreground rounded-tl-none border border-sidebar-border"
                                  }`}
                                >
                                  {m.content}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <Users className="w-10 h-10 mb-2 opacity-40 text-primary" />
                <p className="text-sm font-medium">Select a User</p>
                <p className="text-xs max-w-sm mt-1">
                  Choose a registered account from the left pane to view their details and explore diagnostic history logs.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
