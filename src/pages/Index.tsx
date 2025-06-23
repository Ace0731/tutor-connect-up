
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, BookOpen, MapPin, Star, Phone, Mail } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import ParentDashboard from "@/components/ParentDashboard";
import TutorDashboard from "@/components/TutorDashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<'parent' | 'tutor'>('parent');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);

  const cities = ['Kanpur', 'Lucknow', 'Unnao'];

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (session?.user) {
          // Get user profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            toast({
              title: "Error",
              description: "Failed to load user profile",
              variant: "destructive"
            });
          } else {
            setCurrentUser(profile);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Get user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error('Error fetching profile:', error);
            } else {
              setCurrentUser(profile);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRoleSelect = (role: 'parent' | 'tutor') => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    } else {
      setCurrentUser(null);
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

  if (currentUser) {
    return currentUser.role === 'parent' ? 
      <ParentDashboard user={currentUser} onLogout={handleLogout} /> : 
      <TutorDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">TutorConnect</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            Find the Perfect Tutor Near You
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Connect with qualified tutors in Kanpur, Lucknow, and Unnao. 
            Quality education made accessible for every student.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Card className="w-full md:w-80 cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-800">I'm a Parent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Looking for the right tutor for your child? Post your requirements and connect with qualified educators.
                </p>
                <Button 
                  onClick={() => handleRoleSelect('parent')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  Find Tutors
                </Button>
              </CardContent>
            </Card>

            <Card className="w-full md:w-80 cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BookOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-800">I'm a Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Share your expertise and connect with students who need your help. Start earning today.
                </p>
                <Button 
                  onClick={() => handleRoleSelect('tutor')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                >
                  Start Teaching
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            How It Works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Register</h4>
              <p className="text-gray-600">Create your account as a parent or tutor with basic details</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Post Requirements</h4>
              <p className="text-gray-600">Parents post needs, tutors create profiles with their expertise</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Connect</h4>
              <p className="text-gray-600">Get matched with suitable tutors/students and start learning</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <MapPin className="h-12 w-12 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Local Focus</h4>
              <p>Find tutors in your specific locality across Kanpur, Lucknow, and Unnao</p>
            </div>
            <div>
              <Star className="h-12 w-12 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Quality Tutors</h4>
              <p>Connect with experienced and qualified educators for all subjects</p>
            </div>
            <div>
              <Phone className="h-12 w-12 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Easy Contact</h4>
              <p>Unlock contact details and connect directly with tutors or parents</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">TutorConnect</span>
          </div>
          <p className="text-gray-400">
            Connecting students and tutors across Kanpur, Lucknow, and Unnao
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>info@tutorconnect.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+91 9876543210</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          role={authRole}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default Index;
