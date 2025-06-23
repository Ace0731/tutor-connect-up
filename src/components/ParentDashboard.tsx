
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, User, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import PostRequirementModal from "./PostRequirementModal";

interface ParentDashboardProps {
  user: any;
  onLogout: () => void;
}

const ParentDashboard = ({ user, onLogout }: ParentDashboardProps) => {
  const [showPostModal, setShowPostModal] = useState(false);
  const [parentRequests, setParentRequests] = useState<any[]>([]);

  useEffect(() => {
    loadParentRequests();
  }, [user.id]);

  const loadParentRequests = () => {
    const requests = JSON.parse(localStorage.getItem('parentRequests') || '[]');
    const userRequests = requests.filter((req: any) => req.parentId === user.id);
    setParentRequests(userRequests);
  };

  const handlePostSuccess = () => {
    setShowPostModal(false);
    loadParentRequests();
    toast({
      title: "Success",
      description: "Tutor requirement posted successfully!",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
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
        {/* Action Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Post a Tutor Requirement</span>
                <Button onClick={() => setShowPostModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Requirement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create a detailed requirement to find the perfect tutor for your child. 
                Include subject preferences, timings, and locality details.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Posted Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Posted Requirements</h2>
          
          {parentRequests.length === 0 ? (
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
                    <CardTitle className="flex items-center justify-between">
                      <span>{request.studentName ? `For ${request.studentName}` : 'Tutor Requirement'}</span>
                      <Badge variant="outline">{request.board}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Class & Subjects</p>
                        <p className="font-semibold">Class {request.class}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {request.subjects.map((subject: string) => (
                            <Badge key={subject} variant="secondary">{subject}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Location & Timing</p>
                        <p className="font-semibold">{request.locality}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.preferredTimings}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Posted on {new Date(request.createdAt).toLocaleDateString()}
                      </p>
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
          onClose={() => setShowPostModal(false)}
          onSuccess={handlePostSuccess}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
