
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PostRequirementModalProps {
  user: any;
  existingRequest?: any; // Added for editing
  onClose: () => void;
  onSuccess: () => void;
}

const PostRequirementModal = ({ user, existingRequest, onClose, onSuccess }: PostRequirementModalProps) => {
  const [formData, setFormData] = useState({
    studentName: '',
    board: '',
    class: '',
    subjects: [] as string[],
    preferredTimings: '',
    locality: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingRequest) {
      setFormData({
        studentName: existingRequest.student_name || '',
        board: existingRequest.board || '',
        class: existingRequest.class || '',
        subjects: existingRequest.subjects || [],
        preferredTimings: existingRequest.preferred_timings || '',
        locality: existingRequest.locality || ''
      });
    }
  }, [existingRequest]);

  const boards = ['CBSE', 'ICSE', 'State'];
  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'Hindi', 'Social Science', 'Computer Science', 'Economics',
    'Accountancy', 'Business Studies'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.board || !formData.class || formData.subjects.length === 0 || !formData.locality) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (existingRequest) {
        // Update existing request
        const { error } = await supabase
          .from('parent_requests')
          .update({
            student_name: formData.studentName || null,
            board: formData.board,
            class: formData.class,
            subjects: formData.subjects,
            preferred_timings: formData.preferredTimings,
            locality: formData.locality,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRequest.id);

        if (error) {
          console.error('Error updating parent request:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to update requirement",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      } else {
        // Insert new request
        const insertData = {
          parent_id: user.id,
          student_name: formData.studentName || null,
          board: formData.board,
          class: formData.class,
          subjects: formData.subjects,
          preferred_timings: formData.preferredTimings,
          locality: formData.locality
        };
        const { error } = await supabase
          .from('parent_requests')
          .insert(insertData);

        if (error) {
          console.error('Error creating parent request:', error);
          console.log('Insert data:', insertData);
          toast({
            title: "Error",
            description: error.message || "Failed to post requirement",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Error processing parent request:', error);
      toast({
        title: "Error",
        description: "Failed to process requirement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{existingRequest ? 'Edit Tutor Requirement' : 'Post Tutor Requirement'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="studentName">Student Name (Optional)</Label>
              <Input
                id="studentName"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                placeholder="Enter student's name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="board">Board *</Label>
                <Select value={formData.board} onValueChange={(value) => handleInputChange('board', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map(board => (
                      <SelectItem key={board} value={board}>{board}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Subjects * (Select multiple)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                {subjects.map(subject => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject}
                      checked={formData.subjects.includes(subject)}
                      onCheckedChange={(checked) => handleSubjectChange(subject, checked as boolean)}
                    />
                    <Label htmlFor={subject} className="text-sm">{subject}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="locality">Locality *</Label>
              <Input
                id="locality"
                value={formData.locality}
                onChange={(e) => handleInputChange('locality', e.target.value)}
                placeholder="Enter your locality/area"
                required
              />
            </div>

            <div>
              <Label htmlFor="timings">Preferred Timings</Label>
              <Textarea
                id="timings"
                value={formData.preferredTimings}
                onChange={(e) => handleInputChange('preferredTimings', e.target.value)}
                placeholder="e.g., Monday to Friday 4-6 PM, Weekends 10-12 AM"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (existingRequest ? 'Updating...' : 'Posting...') : (existingRequest ? 'Update Requirement' : 'Post Requirement')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostRequirementModal;
