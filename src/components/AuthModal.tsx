
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  role: 'parent' | 'tutor';
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const AuthModal = ({ role, onClose, onSuccess }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: ''
  });

  const cities = ['Kanpur', 'Lucknow', 'Unnao'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (!isLogin && (!formData.name || !formData.phone || !formData.city)) {
      toast({
        title: "Error", 
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          toast({
            title: "Error",
            description: "Profile not found",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Check if user role matches
        if (profile.role !== role) {
          toast({
            title: "Error",
            description: `This account is registered as a ${profile.role}, not a ${role}`,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Success",
          description: "Login successful!",
        });
        onSuccess(profile);
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name,
              phone: formData.phone,
              city: formData.city,
              role: role
            }
          }
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        if (data.user && !data.session) {
          toast({
            title: "Check your email",
            description: "Please check your email for a confirmation link to complete your registration.",
          });
        } else if (data.user && data.session) {
          // Get the created profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          toast({
            title: "Success",
            description: "Registration successful!",
          });
          onSuccess(profile);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="capitalize">
            {isLogin ? 'Login' : 'Register'} as {role}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required={!isLogin}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required={!isLogin}
                  />
                </div>
                
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
            </Button>
            
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;
