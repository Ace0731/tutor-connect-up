
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, User, BookOpen, Unlock, Lock, Phone, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PostTutorProfileModal from "./PostTutorProfileModal";
import { supabase } from "@/integrations/supabase/client";

interface TutorDashboardProps {
  user: any;
  onLogout: () => void;
}

const TutorDashboard = ({ user, onLogout }: TutorDashboardProps) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<any>(null);
  const [matchedRequests, setMatchedRequests] = useState<any[]>([]);
  const [unlockedContacts, setUnlockedContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutorProfile();
    loadUnlockedContacts();
  }, [user.id]);

  useEffect(() => {
    if (tutorProfile) {
      loadMatchedRequests();
    }
  }, [tutorProfile]);

  const loadTutorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('tutor_id', user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load tutor profile",
          variant: "destructive"
        });
      } else {
        setTutorProfile(data);
      }
    } catch (error) {
      console.error('Error loading tutor profile:', error);
    }
  };

  const loadUnlockedContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_unlocks')
        .select('*')
        .eq('tutor_id', user.id);

      if (error) {
        console.error('Error loading unlocked contacts:', error);
      } else {
        setUnlockedContacts(data || []);
      }
    } catch (error) {
      console.error('Error loading unlocked contacts:', error);
    }
  };

  const loadMatchedRequests = async () => {
    try {
      if (!tutorProfile) {
        setMatchedRequests([]);
        setLoading(false);
        return;
      }

      // Fetch parent requests that match tutor's city, subjects, class range, and locality preferences
      const { data: requests, error } = await supabase
        .from('parent_requests')
        .select(`
          *,
          profiles:parent_id (
            name,
            email,
            phone,
            city
          )
        `)
        .eq('profiles.city', user.city)
        .overlaps('subjects', tutorProfile.subjects)
        .filter('class', 'gte', parseInt(tutorProfile.class_range.split('-')[0]))
        .filter('class', 'lte', parseInt(tutorProfile.class_range.split('-')[1]))
        .in('locality', tutorProfile.locality_preferences); // Assuming locality_preferences is an array of exact localities

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load student requests",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setMatchedRequests(requests || []);
    } catch (error) {
      console.error('Error loading matched requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSuccess = () => {
    setShowProfileModal(false);
    loadTutorProfile();
    toast({
      title: "Success",
      description: "Tutor profile updated successfully!",
    });
  };

  const handleRequestCallback = async (parentId: string, requestId: string) => {
    try {
      const { error } = await supabase
        .from('contact_unlocks')
        .insert({
          tutor_id: user.id,
          parent_id: parentId,
          request_id: requestId,
          status: 'pending'
        });

      if (error) {
        console.error('Error requesting callback:', error);
        toast({
          title: "Error",
          description: "Failed to request callback",
          variant: "destructive"
        });
        return;
      }

      loadUnlockedContacts();
      toast({
        title: "Callback Requested!",
        description: "Waiting for admin approval.",
      });
    } catch (error) {
      console.error('Error requesting callback:', error);
      toast({
        title: "Error",
        description: "Failed to request callback",
        variant: "destructive"
      });
    }
  };

  const getUnlockStatus = (parentId: string, requestId: string) => {
    const unlock = unlockedContacts.find(u => u.parent_id === parentId && u.request_id === requestId);
    return unlock ? unlock.status : null;
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
                    <p className="font-semibold">{tutorProfile.class_range}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fee Per Class</p>
                    <p className="font-semibold">₹{tutorProfile.fee_per_class}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Available Timings</p>
                    <p className="text-sm">{tutorProfile.available_timings}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Locality Preferences</p>
                    <div className="flex flex-wrap gap-1">
                      {tutorProfile.locality_preferences.map((locality: string) => (
                        <Badge key={locality} variant="outline">{locality}</Badge>
                      ))}
                    </div>
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

          {loading ? (
            <div className="text-center py-8">Loading matched requests...</div>
          ) : !tutorProfile ? (
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
                const unlockStatus = getUnlockStatus(request.parent_id, request.id);
                if (!unlockStatus) {
                  return (
                    <Button
                      onClick={() => handleRequestCallback(request.parent_id, request.id)}
                      variant="outline"
                      size="sm"
                    >
                      Request Callback
                    </Button>
                  );
                } else if (unlockStatus === 'pending') {
                  return (
                    <Button variant="secondary" size="sm" disabled>
                      Callback Requested
                    </Button>
                  );
                } else if (unlockStatus === 'approved') {
                  return (
                    <Button variant="secondary" size="sm" disabled>
                      Callback Approved
                    </Button>
                  );
                }
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
