
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, User, BookOpen, Edit, Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PostRequirementModal from "./PostRequirementModal";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

interface ParentDashboardProps {
  user: any;
  onLogout: () => void;
}

const ParentDashboard = ({ user, onLogout }: ParentDashboardProps) => {
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [parentRequests, setParentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadParentRequests();
  }, [user.id]);

  const loadParentRequests = async () => {
    try {
      // Query Firestore for parent_requests where parent_id == user.id
      const q = query(collection(db, 'parent_requests'), where('parent_id', '==', user.id));
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
      // Optionally sort by created_at descending
      requests.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setParentRequests(requests);
    } catch (error) {
      console.error('Error loading parent requests:', error);
      toast({
        title: "Error",
        description: "Failed to load your requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostSuccess = () => {
    setShowPostModal(false);
    setEditingRequest(null);
    loadParentRequests();
    toast({
      title: "Success",
      description: `Tutor requirement ${editingRequest ? 'updated' : 'posted'} successfully!`,
    });
  };

  const handleEdit = (request: any) => {
    setEditingRequest(request);
    setShowPostModal(true);
  };

  const handleDelete = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const docRef = doc(db, 'parent_requests', requestId);
      await deleteDoc(docRef);
      loadParentRequests();
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-start sm:items-center">

          {/* Left: Icon + Title + Welcome */}
          <div className="flex items-start sm:items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600 mt-1 sm:mt-0" />
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Parent Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user.name}</p>
            </div>
          </div>

          {/* Right: City + Logout (stacked on mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 mt-2 sm:mt-0">
            <Badge variant="secondary" className="text-xs sm:text-sm w-fit">{user.city}</Badge>
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
        {/* Action Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <span className="text-lg sm:text-xl font-semibold">Post a Tutor Requirement</span>
                <Button
                  onClick={() => {
                    setEditingRequest(null);
                    setShowPostModal(true);
                  }}
                  className="w-full sm:w-auto text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Requirement
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-gray-600 text-sm sm:text-base">
                Create a detailed requirement to find the perfect tutor for your child.
                Include subject preferences, timings, and locality details.
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Posted Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Posted Requirements</h2>

          {loading ? (
            <div className="text-center py-8">Loading your requirements...</div>
          ) : parentRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Requirements Posted</h3>
                <p className="text-gray-500 mb-4">
                  Start by posting your first tutor requirement to connect with qualified tutors.
                </p>
                <Button onClick={() => setShowPostModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Requirement
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {parentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <span className="text-base sm:text-lg font-semibold">
                        {request.student_name ? `For ${request.student_name}` : 'Tutor Requirement'}
                      </span>
                      <Badge variant="outline" className="w-fit">{request.board}</Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Class & Subjects */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Class & Subjects</p>
                        <p className="font-semibold">Class {request.class}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {request.subjects.map((subject: string) => (
                            <Badge key={subject} variant="secondary">{subject}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Location & Timing */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Location & Timing</p>
                        <p className="font-semibold">{request.locality}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.preferred_timings || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      {/* Date */}
                      <p className="text-sm text-gray-500">
                        Posted on {new Date(request.created_at).toLocaleDateString()}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(request)}
                          disabled={actionLoading === request.id}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          {actionLoading === request.id ? 'Deleting...' : (
                            <>
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post Requirement Modal */}
      {showPostModal && (
        <PostRequirementModal
          user={user}
          existingRequest={editingRequest}
          onClose={() => {
            setShowPostModal(false);
            setEditingRequest(null);
          }}
          onSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
