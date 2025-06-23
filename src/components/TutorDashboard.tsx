
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, User, BookOpen, Unlock, Lock, Phone, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PostTutorProfileModal from "./PostTutorProfileModal";

interface TutorDashboardProps {
  user: any;
  onLogout: () => void;
}

const TutorDashboard = ({ user, onLogout }: TutorDashboardProps) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [matchedRequests, setMatchedRequests] = useState<any[]>([]);
  const [unlockedContacts, setUnlockedContacts] = useState<any[]>([]);

  useEffect(() => {
    loadTutorProfile();
    loadUnlockedContacts();
  }, [user.id]);

  useEffect(() => {
    if (tutorProfile) {
      loadMatchedRequests();
    }
  }, [tutorProfile]);

  const loadTutorProfile = () => {
    const profiles = JSON.parse(localStorage.getItem('tutorProfiles') || '[]');
    const profile = profiles.find((p: any) => p.tutorId === user.id);
    setTutorProfile(profile);
  };

  const loadUnlockedContacts = () => {
    const unlocked = JSON.parse(localStorage.getItem('unlockedContacts') || '[]');
    const tutorUnlocked = unlocked.filter((u: any) => u.tutorId === user.id);
    setUnlockedContacts(tutorUnlocked);
  };

  const loadMatchedRequests = () => {
    const requests = JSON.parse(localStorage.getItem('parentRequests') || '[]');
    
    const matched = requests.filter((request: any) => {
      // Match by city
      if (request.city !== user.city) return false;
      
      // Match by subjects (at least one common subject)
      const hasCommonSubject = request.subjects.some((subject: string) => 
        tutorProfile.subjects.includes(subject)
      );
      if (!hasCommonSubject) return false;
      
      // Match by class range
      const requestClass = parseInt(request.class);
      const minClass = parseInt(tutorProfile.classRangeMin);
      const maxClass = parseInt(tutorProfile.classRangeMax);
      if (requestClass < minClass || requestClass > maxClass) return false;
      
      // Match by locality (simple contains check)
      const hasMatchingLocality = tutorProfile.localityPreferences.some((locality: string) =>
        locality.toLowerCase().includes(request.locality.toLowerCase()) ||
        request.locality.toLowerCase().includes(locality.toLowerCase())
      );
      
      return hasMatchingLocality;
    });
    
    setMatchedRequests(matched);
  };

  const handleProfileSuccess = () => {
    setShowProfileModal(false);
    loadTutorProfile();
    toast({
      title: "Success",
      description: "Tutor profile updated successfully!",
    });
  };

  const handleUnlockContact = (parentId: number) => {
    // Simulate payment success
    const newUnlock = {
      id: Date.now(),
      tutorId: user.id,
      parentId: parentId,
      unlockedAt: new Date().toISOString()
    };
    
    const unlocked = JSON.parse(localStorage.getItem('unlockedContacts') || '[]');
    unlocked.push(newUnlock);
    localStorage.setItem('unlockedContacts', JSON.stringify(unlocked));
    
    setUnlockedContacts(prev => [...prev, newUnlock]);
    
    toast({
      title: "Contact Unlocked!",
      description: "Payment successful. You can now see the parent's contact details.",
    });
  };

  const isContactUnlocked = (parentId: number) => {
    return unlockedContacts.some(u => u.parentId === parentId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tutor Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">{user.city}</Badge>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{tutorProfile ? 'Your Profile' : 'Create Your Profile'}</span>
                <Button onClick={() => setShowProfileModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {tutorProfile ? 'Edit Profile' : 'Create Profile'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tutorProfile ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Subjects</p>
                    <div className="flex flex-wrap gap-1">
                      {tutorProfile.subjects.map((subject: string) => (
                        <Badge key={subject} variant="secondary">{subject}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Class Range</p>
                    <p className="font-semibold">Class {tutorProfile.classRangeMin} - {tutorProfile.classRangeMax}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fee Per Class</p>
                    <p className="font-semibold">₹{tutorProfile.feePerClass}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Available Timings</p>
                    <p className="text-sm">{tutorProfile.availableTimings}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  Create your tutor profile to start receiving student requests. 
                  Include your subjects, fee, and availability.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Matched Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Matched Student Requests {matchedRequests.length > 0 && `(${matchedRequests.length})`}
          </h2>
          
          {!tutorProfile ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Create Your Profile First</h3>
                <p className="text-gray-500 mb-4">
                  You need to create your tutor profile to see matched student requests.
                </p>
                <Button onClick={() => setShowProfileModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          ) : matchedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Matches Yet</h3>
                <p className="text-gray-500">
                  No student requests match your profile criteria yet. 
                  Check back later or update your profile to match more requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {matchedRequests.map((request) => {
                const unlocked = isContactUnlocked(request.parentId);
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{request.studentName ? `${request.studentName}` : 'Student'} - Class {request.class}</span>
                        <Badge variant="outline">{request.board}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Subjects Required</p>
                          <div className="flex flex-wrap gap-1">
                            {request.subjects.map((subject: string) => (
                              <Badge key={subject} variant="secondary">{subject}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Location</p>
                          <p className="font-semibold">{request.locality}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Preferred Timings</p>
                          <p className="text-sm">{request.preferredTimings || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Posted</p>
                          <p className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Parent Contact</p>
                            {unlocked ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold">{request.parentPhone}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-green-600" />
                                  <span className="font-semibold">{request.parentEmail}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-gray-500">
                                <Lock className="h-4 w-4" />
                                <span>Contact details locked</span>
                              </div>
                            )}
                          </div>
                          
                          {!unlocked && (
                            <Button 
                              onClick={() => handleUnlockContact(request.parentId)}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Unlock Contact for ₹49
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <PostTutorProfileModal
          user={user}
          existingProfile={tutorProfile}
          onClose={() => setShowProfileModal(false)}
          onSuccess={handleProfileSuccess}
        />
      )}
    </div>
  );
};

export default TutorDashboard;
