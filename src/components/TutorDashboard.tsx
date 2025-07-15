// 📦 Imports remain the same
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, BookOpen, Unlock, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PostTutorProfileModal from "./PostTutorProfileModal";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, addDoc } from "firebase/firestore";
import { Link } from 'react-router-dom';

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
  }, [tutorProfile, unlockedContacts]); // add unlockedContacts to refresh UI

  const loadTutorProfile = async () => {
    try {
      const q = query(collection(db, 'tutor_profiles'), where('tutor_id', '==', user.id));
      const querySnapshot = await getDocs(q);
      const profile = querySnapshot.docs.length > 0 ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } : null;
      setTutorProfile(profile);
    } catch (error) {
      console.error('Error loading tutor profile:', error);
      toast({ title: "Error", description: "Failed to load tutor profile", variant: "destructive" });
    }
  };

  const loadUnlockedContacts = async () => {
    try {
      const q = query(collection(db, 'contact_unlocks'), where('tutor_id', '==', user.id));
      const querySnapshot = await getDocs(q);
      const contacts = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setUnlockedContacts(contacts);
    } catch (error) {
      console.error('Error loading unlocked contacts:', error);
    }
  };

  const getUnlockStatus = (parentId: string, requestId: string) => {
    const unlock = unlockedContacts.find(u => u.parent_id === parentId && u.request_id === requestId);
    return unlock ? unlock.status : null;
  };

  const loadMatchedRequests = async () => {
    try {
      if (!tutorProfile) {
        setMatchedRequests([]);
        setLoading(false);
        return;
      }

      const trimmedCity = (user.city || "").trim();
      const q = query(collection(db, 'parent_requests'), where('city', '==', trimmedCity));
      const querySnapshot = await getDocs(q);

      let requests = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as any[];

      const [minClass, maxClass] = tutorProfile.class_range.replace(/\s/g, '').split('-').map(Number);

      const newRequests = [];
      const unlockedRequests = [];

      for (const req of requests) {
        const subjectsValid = Array.isArray(req.subjects) && Array.isArray(tutorProfile.subjects);
        const localityMatch = tutorProfile.locality_preferences.includes(req.locality);
        const subjectMatch = subjectsValid && req.subjects.some((s: string) => tutorProfile.subjects.includes(s));
        const classMatch = parseInt(req.class) >= minClass && parseInt(req.class) <= maxClass;

        if (localityMatch && subjectMatch && classMatch) {
          const status = getUnlockStatus(req.parent_id, req.id);
          req.unlockStatus = status;

          if (status) {
            unlockedRequests.push(req);
          } else {
            newRequests.push(req);
          }
        }
      }

      setMatchedRequests([...newRequests, ...unlockedRequests]);
    } catch (error) {
      console.error('Error loading matched requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSuccess = () => {
    setShowProfileModal(false);
    loadTutorProfile();
    toast({ title: "Success", description: "Tutor profile updated successfully!" });
  };

  const handleRequestCallback = async (parentId: string, requestId: string) => {
    try {
      const docRef = await addDoc(collection(db, 'contact_unlocks'), {
        tutor_id: user.id,
        parent_id: parentId,
        request_id: requestId,
        status: 'pending',
        unlocked_at: new Date().toISOString()
      });

      // Update UI immediately
      setUnlockedContacts(prev => [
        ...prev,
        {
          id: docRef.id,
          tutor_id: user.id,
          parent_id: parentId,
          request_id: requestId,
          status: 'pending',
          unlocked_at: new Date().toISOString()
        }
      ]);

      toast({ title: "Callback Requested!", description: "Waiting for admin approval." });
    } catch (error) {
      console.error('Error requesting callback:', error);
      toast({ title: "Error", description: "Failed to request callback", variant: "destructive" });
    }
  };

  const renderRequestCard = (request: any) => {
    const status = request.unlockStatus;

    return (
      <Card key={request.id}>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="text-lg font-semibold">
              Class {request.class} – {request.board}
            </div>
            <Badge variant="outline">{request.locality}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Subjects Required:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {request.subjects.map((subject: string) => (
                <Badge key={subject}>{subject}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Student Name:</p>
            <p className="text-md font-medium">{request.student_name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 italic">Contact details will be shared externally by the admin after callback approval.</p>
          </div>

          <div>
            {!status ? (
              <Button
                onClick={() => handleRequestCallback(request.parent_id, request.id)}
                variant="outline"
                size="sm"
              >
                <Unlock className="mr-2 h-4 w-4" />
                Request Callback
              </Button>
            ) : status === 'pending' ? (
              <Button variant="secondary" size="sm" disabled>
                <Lock className="mr-2 h-4 w-4" />
                Callback Requested
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled>
                <Unlock className="mr-2 h-4 w-4" />
                Callback Approved
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-start sm:items-center">

          {/* Left Section: Icon + Title + Welcome */}
          <div className="flex items-start sm:items-center space-x-3">
            <BookOpen className="h-8 w-8 text-green-600 mt-1 sm:mt-0" />
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Tutor Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
          </div>

          {/* Right Section: Stack City & Button on Mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 mt-2 sm:mt-0">
            <Badge variant="secondary" className="text-xs sm:text-sm w-fit">{user.city}</Badge>
            <Button asChild variant="outline" className="px-4 py-2 text-sm flex items-center justify-center">
              <Link to="/blogs" className="text-gray-600 hover:text-blue-600">
                Blogs
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
              className="px-4 py-2 text-sm flex items-center justify-center"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>

        </div>
      </header>


      <div className="container mx-auto px-4 py-8">
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
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading matched requests...</div>
        ) : (
          <>
            <div className="space-y-6 mb-10">
              <h3 className="text-xl font-semibold text-gray-800 text-center">New Matches</h3>

              {matchedRequests.filter(r => !r.unlockStatus).length === 0 ? (
                <p className="text-gray-500">No new Matches found.</p>
              ) : (
                matchedRequests.filter(r => !r.unlockStatus).map(renderRequestCard)
              )}
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 text-center">Requested</h3>
              {matchedRequests.filter(r => r.unlockStatus).length === 0 ? (
                <p className="text-gray-500">No unlocked Matches yet.</p>
              ) : (
                matchedRequests.filter(r => r.unlockStatus).map(renderRequestCard)
              )}
            </div>
          </>
        )}
      </div>

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
