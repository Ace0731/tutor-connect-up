
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_unlocks')
        .select(`
          *,
          tutor:tutor_id (name, email, phone),
          parent:parent_id (name, email, phone),
          parent_request:request_id (*)
        `)
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading pending requests:', error);
        toast({
          title: "Error",
          description: "Failed to load pending requests",
          variant: "destructive"
        });
      } else {
        setPendingRequests(data || []);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'denied') => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from('contact_unlocks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) {
        console.error(`Error ${status}ing request:`, error);
        toast({
          title: "Error",
          description: `Failed to ${status} request`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `Request ${status} successfully!`,
        });
        loadPendingRequests(); // Reload requests
      }
    } catch (error) {
      console.error(`Error ${status}ing request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} request`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <Badge variant="secondary">{user.email}</Badge>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Contact Unlock Requests</h2>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">All contact unlock requests have been processed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Request from {request.tutor ? `${request.tutor.name} (${request.tutor.email})` : 'N/A'}</span>
                    <Badge variant="outline">{request.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Parent Details</p>
                      <p className="font-semibold">{request.parent?.name}</p>
                      <p className="text-sm text-gray-600">{request.parent?.email}</p>
                      <p className="text-sm text-gray-600">{request.parent?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Parent Request Details</p>
                      <p className="font-semibold">Class {request.parent_request?.class} - {request.parent_request?.board}</p>
                      <p className="text-sm text-gray-600">Subjects: {request.parent_request?.subjects?.join(', ')}</p>
                      <p className="text-sm text-gray-600">Locality: {request.parent_request?.locality}</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={() => handleStatusUpdate(request.id, 'approved')}
                      disabled={actionLoading === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(request.id, 'denied')}
                      disabled={actionLoading === request.id}
                      variant="destructive"
                    >
                      {actionLoading === request.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
