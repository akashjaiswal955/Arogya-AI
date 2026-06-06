"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Mail, Lock, User, LoaderCircle, ShieldAlert } from "lucide-react";

interface AuthModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AuthModal({ isOpen, onOpenChange, trigger }: AuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register" | "admin">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form States
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Admin Form States
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const { login, register } = useAuth();
  const { toast } = useToast();

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (loginEmail.toLowerCase() === "admin@arogya.ai" || loginEmail.toLowerCase() === "admin") {
      toast({
        title: "Admin Access Required",
        description: "Please use the Admin Access tab to log in as administrator.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        toast({
          title: "Welcome back!",
          description: res.message,
        });
        setOpen(false);
        setLoginEmail("");
        setLoginPassword("");
      } else {
        toast({
          title: "Authentication Failed",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regConfirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Block registering as admin
    if (regUsername.toLowerCase() === "admin") {
      toast({
        title: "Reserved Username",
        description: "This username is reserved for system administrators.",
        variant: "destructive",
      });
      return;
    }

    if (regPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please confirm your password correctly",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(regUsername, regPassword);
      if (res.success) {
        toast({
          title: "Account Created!",
          description: res.message,
        });
        setOpen(false);
        setRegUsername("");
        setRegPassword("");
        setRegConfirmPassword("");
      } else {
        toast({
          title: "Registration Failed",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Ensure it is admin
    if (adminEmail.toLowerCase() !== "admin@arogya.ai" && adminEmail.toLowerCase() !== "admin") {
      toast({
        title: "Access Denied",
        description: "This tab is strictly for administrator credentials.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(adminEmail, adminPassword);
      if (res.success) {
        toast({
          title: "Access Granted",
          description: "Admin panel console has been activated.",
        });
        setOpen(false);
        setAdminEmail("");
        setAdminPassword("");
      } else {
        toast({
          title: "Verification Failed",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[420px] bg-background/95 border-border backdrop-blur-md p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-2xl font-headline font-bold tracking-tight text-center">
            {activeTab === "login" 
              ? "Welcome back" 
              : activeTab === "register" 
              ? "Create an account" 
              : "Administrator Access"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {activeTab === "login" 
              ? "Access your past health awareness data & chats" 
              : activeTab === "register" 
              ? "Save and sync your health queries securely" 
              : "Access the diagnostic investigation panel"}
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={(val) => setActiveTab(val as "login" | "register" | "admin")} 
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs">
              Register
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-semibold text-destructive data-[state=active]:text-destructive">
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Login Content */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Username or Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    placeholder="Enter username or email"
                    type="text"
                    autoComplete="username"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    placeholder="Enter password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-2 font-medium bg-primary hover:bg-primary/95 text-primary-foreground h-10 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Sign In
              </Button>
            </form>
          </TabsContent>

          {/* Register Content */}
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-username"
                    placeholder="Choose a username"
                    type="text"
                    autoComplete="username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    placeholder="Create a password (min. 6 chars)"
                    type="password"
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm-password"
                    placeholder="Confirm your password"
                    type="password"
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-2 font-medium bg-primary hover:bg-primary/95 text-primary-foreground h-10 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Register Account
              </Button>
            </form>
          </TabsContent>

          {/* Admin Content */}
          <TabsContent value="admin" className="space-y-4 mt-4">
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-2 text-xs">
                <ShieldAlert className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Authorized Staff Access</p>
                  <p className="opacity-80">This portal is for system administrators. Default login:</p>
                  <p className="font-mono bg-background/50 px-1 py-0.5 rounded inline-block mt-1 font-bold text-[10px]">
                    admin@arogya.ai / admin
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    placeholder="admin@arogya.ai"
                    type="text"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    placeholder="Enter admin password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-2 font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground h-10 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoaderCircle className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ShieldAlert className="w-4 h-4 mr-2" />
                )}
                Verify & Log In
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
