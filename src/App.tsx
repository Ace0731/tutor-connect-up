import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type UserProfile = {
  id: string;
  role: 'parent' | 'tutor' | 'admin';
  [key: string]: any;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
      didTimeout = true;
      setLoading(false);
      toast({
        title: "Error",
        description: "Request timed out. Please check your connection and try again.",
        variant: "destructive"
      });
    }, 8000); // 8 seconds fallback

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (didTimeout) return;
        try {
          if (session?.user) {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) {
              toast({
                title: "Error",
                description: "Failed to load user profile. Please try logging in again.",
                variant: "destructive"
              });
              setCurrentUser(null);
            } else if (profile) {
              setCurrentUser(profile as UserProfile);
            } else {
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setCurrentUser(null);
        } finally {
          if (!didTimeout) setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    );
    subscription = data.subscription;

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (didTimeout) return;
        if (error) {
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        const session = data?.session;
        if (session?.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: profile, error }) => {
              if (error) {
                setCurrentUser(null);
              } else if (profile) {
                setCurrentUser(profile as UserProfile);
              } else {
                setCurrentUser(null);
              }
              if (!didTimeout) setLoading(false);
              clearTimeout(timeoutId);
            });
        } else {
          setCurrentUser(null);
          if (!didTimeout) setLoading(false);
          clearTimeout(timeoutId);
        }
      })
      .catch((err: unknown) => {
        console.error('Session fetch error:', err);
        setCurrentUser(null);
        if (!didTimeout) setLoading(false);
        clearTimeout(timeoutId);
      });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = async () => {
    setCurrentUser(null); // Optimistically update UI
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index currentUser={currentUser} onLogout={handleLogout} />} />
            {currentUser?.role === 'admin' && (
              <Route path="/admin" element={<AdminDashboard user={currentUser} onLogout={handleLogout} />} />
            )}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
