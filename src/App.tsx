import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

import { useState, useEffect } from 'react';
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc } from "firebase/firestore";
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
    // Firebase Auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Fetch user profile from Firestore
          const docRef = doc(db, 'profiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCurrentUser({ id: user.uid, ...docSnap.data() } as UserProfile);
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    setCurrentUser(null); // Optimistically update UI
    try {
      await auth.signOut();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center relative overflow-hidden">
        {/* Animated Blobs in Background */}
        <div className="absolute w-72 h-72 bg-indigo-300 rounded-full opacity-30 animate-ping -top-10 -left-10" />
        <div className="absolute w-72 h-72 bg-blue-300 rounded-full opacity-30 animate-ping -bottom-10 -right-10" />

        {/* Glassy Floating Loader Card */}
        <div className="relative z-10 backdrop-blur-xl bg-white/60 border border-white/20 rounded-xl shadow-2xl p-10 flex flex-col items-center space-y-6 animate-fadeIn">
          {/* Spinner Icon with Pulse */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin" />
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-700" />
          </div>

          {/* Animated Loading Dots */}
          <div className="flex text-lg font-medium text-indigo-800 space-x-1">
            <span>Loading</span>
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-150">.</span>
            <span className="animate-bounce delay-300">.</span>
          </div>

          {/* Subtext */}
          <p className="text-sm text-gray-700 text-center max-w-xs animate-pulse">
            Fetching everything you need to get started — hang tight!
          </p>
        </div>
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
