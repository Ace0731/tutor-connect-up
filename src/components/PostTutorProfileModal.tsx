
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { z } from "zod";

interface PostTutorProfileModalProps {
  user: any;
  existingProfile?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PostTutorProfileModal = ({ user, existingProfile, onClose, onSuccess }: PostTutorProfileModalProps) => {
  const [subjects, setSubjects] = useState<string[]>(existingProfile?.subjects || []);
  const [classRangeMin, setClassRangeMin] = useState(existingProfile?.class_range?.split('-')[0]?.trim() || '');
  const [classRangeMax, setClassRangeMax] = useState(existingProfile?.class_range?.split('-')[1]?.trim() || '');
  const [localityPreferences, setLocalityPreferences] = useState<string[]>(existingProfile?.locality_preferences || []);
  const [feePerClass, setFeePerClass] = useState(existingProfile?.fee_per_class?.toString() || '');
  const [availableTimings, setAvailableTimings] = useState(existingProfile?.available_timings || '');
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentLocality, setCurrentLocality] = useState('');
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState(existingProfile?.city || '');

  const availableSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
    'History', 'Geography', 'Political Science', 'Economics', 'Computer Science',
    'Accountancy', 'Business Studies', 'Psychology', 'Sociology'
  ];

  const cities = ['Kanpur', 'Lucknow', 'Unnao'];

  const addSubject = () => {
    if (currentSubject && !subjects.includes(currentSubject)) {
      setSubjects([...subjects, currentSubject]);
      setCurrentSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  const addLocality = () => {
    if (currentLocality && !localityPreferences.includes(currentLocality)) {
      setLocalityPreferences([...localityPreferences, currentLocality]);
      setCurrentLocality('');
    }
  };

  const removeLocality = (locality: string) => {
    setLocalityPreferences(localityPreferences.filter(l => l !== locality));
  };

  const formSchema = z.object({
    subjects: z.array(z.string()).min(1, { message: "Please add at least one subject" }),
    classRangeMin: z.string().min(1, { message: "Please select a minimum class" }),
    classRangeMax: z.string().min(1, { message: "Please select a maximum class" }),
    localityPreferences: z.array(z.string()).min(1, { message: "Please add at least one locality preference" }),
    feePerClass: z.string().regex(/^\d+$/, { message: "Fee per class must be a number" }).transform(Number),
    availableTimings: z.string().min(1, { message: "Please enter your available timings" }),
  }).refine(data => parseInt(data.classRangeMin) <= parseInt(data.classRangeMax), {
    message: "Minimum class cannot be greater than maximum class",
    path: ["classRangeMin"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = formSchema.safeParse({
      subjects,
      classRangeMin,
      classRangeMax,
      localityPreferences,
      feePerClass,
      availableTimings
    });

    if (!validation.success) {
      validation.error.errors.forEach((error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      });
      setLoading(false);
      return;
    }

    try {
      const profileData = {
        tutor_id: user.id,
        subjects: validation.data.subjects,
        class_range: `${validation.data.classRangeMin}-${validation.data.classRangeMax}`,
        locality_preferences: validation.data.localityPreferences,
        fee_per_class: validation.data.feePerClass,
        available_timings: validation.data.availableTimings,
        city: city
      };

      let error;

      if (existingProfile) {
        try {
          const docRef = doc(db, 'tutor_profiles', existingProfile.id);
          await updateDoc(docRef, profileData);
          error = null;
        } catch (updateError: any) {
          error = updateError;
        }
      } else {
        try {
          await addDoc(collection(db, 'tutor_profiles'), profileData);
          error = null;
        } catch (insertError: any) {
          error = insertError;
        }
      }

      if (error) {
        console.error('Error saving tutor profile:', error);
        toast({
          title: "Error",
          description: "Failed to save tutor profile",
          variant: "destructive"
        });
        return;
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving tutor profile:', error);
      toast({
        title: "Error",
        description: "Failed to save tutor profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {existingProfile ? 'Edit Tutor Profile' : 'Create Tutor Profile'}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="city">City *</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(cityOption => (
                    <SelectItem key={cityOption} value={cityOption}>{cityOption}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Subjects */}
            <div>
              <Label htmlFor="subjects">Subjects You Teach *</Label>
              <div className="flex gap-2 mt-2">
                <Select value={currentSubject} onValueChange={setCurrentSubject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects
                      .filter(subject => !subjects.includes(subject))
                      .map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addSubject} disabled={!currentSubject}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {subjects.map(subject => (
                  <Badge key={subject} variant="secondary" className="cursor-pointer" onClick={() => removeSubject(subject)}>
                    {subject} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Class Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="classRangeMin">Minimum Class *</Label>
                <Select value={classRangeMin} onValueChange={setClassRangeMin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Min Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="classRangeMax">Maximum Class *</Label>
                <Select value={classRangeMax} onValueChange={setClassRangeMax}>
                  <SelectTrigger>
                    <SelectValue placeholder="Max Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Locality Preferences */}
            <div>
              <Label htmlFor="locality">Locality Preferences *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={currentLocality}
                  onChange={(e) => setCurrentLocality(e.target.value)}
                  placeholder="Enter locality name"
                  className="flex-1"
                />
                <Button type="button" onClick={addLocality} disabled={!currentLocality}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {localityPreferences.map(locality => (
                  <Badge key={locality} variant="secondary" className="cursor-pointer" onClick={() => removeLocality(locality)}>
                    {locality} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Fee Per Class */}
            <div>
              <Label htmlFor="feePerClass">Fee Per Class (₹) *</Label>
              <Input
                id="feePerClass"
                type="number"
                value={feePerClass}
                onChange={(e) => setFeePerClass(e.target.value)}
                placeholder="Enter fee amount"
                required
              />
            </div>

            {/* Available Timings */}
            <div>
              <Label htmlFor="availableTimings">Available Timings *</Label>
              <Textarea
                id="availableTimings"
                value={availableTimings}
                onChange={(e) => setAvailableTimings(e.target.value)}
                placeholder="e.g., Monday-Friday: 4PM-8PM, Saturday: 10AM-6PM"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : existingProfile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostTutorProfileModal;
