import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { Loader2 } from "lucide-react";

import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";
import LoadingSpinner from "@/components/LoadingSpinner";

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
    return <LoadingSpinner />;
  }



  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index currentUser={currentUser} onLogout={handleLogout} />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:id" element={<BlogPost />} />
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
