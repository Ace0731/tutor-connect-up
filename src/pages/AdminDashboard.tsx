import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

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
      const q = query(collection(db, 'contact_unlocks'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);

      const requests = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const unlock = { id: docSnap.id, ...data };

          const tutor = data.tutor_id
            ? (await getDoc(doc(db, 'profiles', data.tutor_id))).data()
            : null;

          const parent = data.parent_id
            ? (await getDoc(doc(db, 'profiles', data.parent_id))).data()
            : null;

          const parent_request = data.request_id
            ? (await getDoc(doc(db, 'parent_requests', data.request_id))).data()
            : null;

          return { ...unlock, tutor, parent, parent_request };
        })
      );

      setPendingRequests(requests); // <-- This should be outside map
    } catch (error) {
      console.error("Error loading requests:", error);
      toast({
        title: "Error",
        description: "Failed to load pending requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'denied') => {
    setActionLoading(requestId);
    try {
      const ref = doc(db, 'contact_unlocks', requestId);
      await updateDoc(ref, {
        status,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: "Updated",
        description: `Request marked as ${status}.`,
      });

      // Remove from UI without reload
      setPendingRequests((prev) => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: `Failed to ${status} the request.`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-start sm:items-center">

          {/* Left Section: Title + Email (Stack on Mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <Badge variant="secondary" className="text-xs sm:text-sm mt-1 sm:mt-0 w-fit">
              {user.email}
            </Badge>
          </div>

          {/* Right Section: Logout Button (Always Right, Icon-only on Mobile) */}
          <Button
            variant="outline"
            onClick={onLogout}
            className="px-4 py-2 text-sm flex items-center"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Logout</span>
          </Button>

        </div>
      </header>


      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Pending Unlock Requests</h2>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            Loading...
          </div>
        ) : pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Requests</h3>
              <p className="text-gray-500">All requests are handled.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingRequests.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>
                      {req.tutor?.name || "Unknown Tutor"} ({req.tutor?.phone || "N/A"})
                    </span>
                    <Badge variant="outline">{req.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Parent</p>
                      <p className="font-semibold">{req.parent?.name || "N/A"}</p>
                      <p className="text-sm text-gray-600">{req.parent?.email}</p>
                      <p className="text-sm text-gray-600">{req.parent?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Request</p>
                      <p className="font-semibold">
                        Class {req.parent_request?.class} – {req.parent_request?.board}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subjects: {req.parent_request?.subjects?.join(', ') || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Locality: {req.parent_request?.locality || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => handleStatusUpdate(req.id, 'approved')}
                      disabled={actionLoading === req.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(req.id, 'denied')}
                      disabled={actionLoading === req.id}
                      variant="destructive"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
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
}
export default AdminDashboard;
