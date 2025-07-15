
import { useState } from 'react';
import { Helmet } from "react-helmet";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, BookOpen, MapPin, Star, Phone, Mail } from "lucide-react";

import AuthModal from "@/components/AuthModal";
import AdminDashboard from "@/pages/AdminDashboard";
import ParentDashboard from "@/components/ParentDashboard";
import TutorDashboard from "@/components/TutorDashboard";
import { Link } from 'react-router-dom';


<Helmet>
  <title>TutorConnect | Find Tutors in Kanpur, Lucknow, Unnao</title>
  <meta name="description" content="Find qualified home tutors in Kanpur, Lucknow, and Unnao. Connect with trusted educators to help your child learn better." />
  <meta name="keywords" content="home tutor Kanpur, tutors in Lucknow, Unnao tutors, find tutor, online tuition, TutorConnect" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="TutorConnect by The Sahil Sir" />
</Helmet>


type UserProfile = {
  id: string;
  role: 'parent' | 'tutor' | 'admin';
  [key: string]: any;
};

interface IndexProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

const Index = ({ currentUser, onLogout }: IndexProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<'parent' | 'tutor' | undefined>(undefined);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedCity, setSelectedCity] = useState('');

  const cities = ['Kanpur', 'Lucknow', 'Unnao'];

  const handleLoginClick = () => {
    setAuthMode('login');
    setAuthRole(undefined);
    setShowAuthModal(true);
  };

  const handleRegisterParentClick = () => {
    setAuthMode('register');
    setAuthRole('parent');
    setShowAuthModal(true);
  };

  const handleRegisterTutorClick = () => {
    setAuthMode('register');
    setAuthRole('tutor');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // currentUser and onLogout are now managed by App.tsx, so no need to update state here
  };

  if (currentUser) {
    if (currentUser.role === 'parent') {
      return <ParentDashboard user={currentUser} onLogout={onLogout} />;
    } else if (currentUser.role === 'tutor') {
      return <TutorDashboard user={currentUser} onLogout={onLogout} />;
    } else if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={onLogout} />;
    } else {
      // fallback for unknown role
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div>
            <div className="text-2xl mb-4">Unknown user role.</div>
            <Button onClick={onLogout}>Logout</Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Logo + Title */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              TutorConnect by The Sahil Sir
            </h1>
          </div>

          {/* Select City + Login Button (always side-by-side) */}
          <div className="flex flex-row items-center gap-4">
            <Link to="/blogs" className="text-gray-600 hover:text-blue-600">
              Blogs
            </Link>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm w-full sm:w-auto"
            >
              Login
            </Button>
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
            {/* Register as Parent Card */}
            <Card className="w-full md:w-80 cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-800">Register as Parent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Looking for the right tutor for your child? Post your requirements and connect with qualified educators in your city.
                </p>
                <Button
                  onClick={handleRegisterParentClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  Register as Parent
                </Button>
              </CardContent>
            </Card>
            {/* Register as Tutor Card */}
            <Card className="w-full md:w-80 cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BookOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-800">Register as Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Share your expertise and connect with students who need your help. Start earning and making a difference today.
                </p>
                <Button
                  onClick={handleRegisterTutorClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                >
                  Register as Tutor
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
              <p>Get connected with best Teachers</p>
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


          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 sm:space-x-6 mt-4 text-sm text-center">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>info@thesahilsirstutorials.in</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>+91 8887622182</span>
            </div>
          </div>



          <a
            href="https://ace0731.github.io
"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-6 text-gray-500 hover:text-white transition-colors"
          >
            <p>Made with ❤️ by <strong>Ace</strong></p>

          </a>
          <p>© 2025. All rights reserved.</p>
        </div>
      </footer>


      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          role={authMode === 'register' ? authRole : undefined}
          city={selectedCity}
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={(mode) => {
            setAuthMode(mode);
            if (mode === 'login') setAuthRole(undefined);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default Index;
