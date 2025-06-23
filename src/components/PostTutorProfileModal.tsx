
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface PostTutorProfileModalProps {
  user: any;
  existingProfile?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PostTutorProfileModal = ({ user, existingProfile, onClose, onSuccess }: PostTutorProfileModalProps) => {
  const [formData, setFormData] = useState({
    subjects: existingProfile?.subjects || [],
    classRangeMin: existingProfile?.classRangeMin || '1',
    classRangeMax: existingProfile?.classRangeMax || '12',
    localityPreferences: existingProfile?.localityPreferences || [],
    feePerClass: existingProfile?.feePerClass || '',
    availableTimings: existingProfile?.availableTimings || '',
    customLocality: ''
  });

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'Hindi', 'Social Science', 'Computer Science', 'Economics', 
    'Accountancy', 'Business Studies'
  ];

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const commonLocalities = [
    'Civil Lines', 'Mall Road', 'Swaroop Nagar', 'Kalyanpur', 'Kidwai Nagar',
    'Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar',
    'Cantonment', 'Sadar', 'GT Road', 'Shastri Nagar'
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

  const handleLocalityChange = (locality: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      localityPreferences: checked 
        ? [...prev.localityPreferences, locality]
        : prev.localityPreferences.filter(l => l !== locality)
    }));
  };

  const handleAddCustomLocality = () => {
    if (formData.customLocality.trim() && !formData.localityPreferences.includes(formData.customLocality.trim())) {
      setFormData(prev => ({
        ...prev,
        localityPreferences: [...prev.localityPreferences, prev.customLocality.trim()],
        customLocality: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.subjects.length === 0 || formData.localityPreferences.length === 0 || !formData.feePerClass) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const profileData = {
      id: existingProfile?.id || Date.now(),
      tutorId: user.id,
      tutorName: user.name,
      tutorEmail: user.email,
      tutorPhone: user.phone,
      city: user.city,
      subjects: formData.subjects,
      classRangeMin: formData.classRangeMin,
      classRangeMax: formData.classRangeMax,
      localityPreferences: formData.localityPreferences,
      feePerClass: formData.feePerClass,
      availableTimings: formData.availableTimings,
      createdAt: existingProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const profiles = JSON.parse(localStorage.getItem('tutorProfiles') || '[]');
    
    if (existingProfile) {
      const index = profiles.findIndex((p: any) => p.id === existingProfile.id);
      profiles[index] = profileData;
    } else {
      profiles.push(profileData);
    }
    
    localStorage.setItem('tutorProfiles', JSON.stringify(profiles));
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{existingProfile ? 'Edit Profile' : 'Create Tutor Profile'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subjects */}
            <div>
              <Label className="text-base font-semibold">Subjects You Teach * (Select multiple)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
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

            {/* Class Range */}
            <div>
              <Label className="text-base font-semibold">Class Range You Teach *</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="minClass">From Class</Label>
                  <select
                    id="minClass"
                    className="w-full p-2 border rounded"
                    value={formData.classRangeMin}
                    onChange={(e) => handleInputChange('classRangeMin', e.target.value)}
                  >
                    {classes.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="maxClass">To Class</Label>
                  <select
                    id="maxClass"
                    className="w-full p-2 border rounded"
                    value={formData.classRangeMax}
                    onChange={(e) => handleInputChange('classRangeMax', e.target.value)}
                  >
                    {classes.map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Locality Preferences */}
            <div>
              <Label className="text-base font-semibold">Locality Preferences * (Select areas you can teach in)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto border rounded p-3">
                {commonLocalities.map(locality => (
                  <div key={locality} className="flex items-center space-x-2">
                    <Checkbox
                      id={locality}
                      checked={formData.localityPreferences.includes(locality)}
                      onCheckedChange={(checked) => handleLocalityChange(locality, checked as boolean)}
                    />
                    <Label htmlFor={locality} className="text-sm">{locality}</Label>
                  </div>
                ))}
              </div>
              
              {/* Custom Locality */}
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Add custom locality"
                  value={formData.customLocality}
                  onChange={(e) => handleInputChange('customLocality', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomLocality())}
                />
                <Button type="button" onClick={handleAddCustomLocality} size="sm">
                  Add
                </Button>
              </div>
              
              {/* Selected Custom Localities */}
              {formData.localityPreferences.some(l => !commonLocalities.includes(l)) && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Custom localities:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.localityPreferences
                      .filter(l => !commonLocalities.includes(l))
                      .map(locality => (
                        <span key={locality} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {locality}
                          <button
                            type="button"
                            onClick={() => handleLocalityChange(locality, false)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fee */}
            <div>
              <Label htmlFor="fee">Fee Per Class (₹) *</Label>
              <Input
                id="fee"
                type="number"
                value={formData.feePerClass}
                onChange={(e) => handleInputChange('feePerClass', e.target.value)}
                placeholder="Enter your fee per class"
                required
              />
            </div>

            {/* Available Timings */}
            <div>
              <Label htmlFor="timings">Available Timings</Label>
              <Textarea
                id="timings"
                value={formData.availableTimings}
                onChange={(e) => handleInputChange('availableTimings', e.target.value)}
                placeholder="e.g., Monday to Friday 4-8 PM, Weekends 9 AM-6 PM"
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                {existingProfile ? 'Update Profile' : 'Create Profile'}
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

export default PostTutorProfileModal;
