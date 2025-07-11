
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface AuthModalProps {
  role?: 'parent' | 'tutor'; // Now optional, only needed for registration
  city?: string;
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
  onSuccess: (user: any) => void;
}

const AuthModal = ({ role, city, mode, onClose, onSwitchMode, onSuccess }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  useEffect(() => { setIsLogin(mode === 'login'); }, [mode]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: city || '',
    role: role || ''
  });

  const cities = ['Kanpur', 'Lucknow', 'Unnao'];
  const roles = ['parent', 'tutor'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
    city: z.string().min(1, { message: "Please select a city" }),
    role: z.string().min(1, { message: "Please select a role" })
  }).refine((data) => {
    if (!isLogin) {
      return data.password === data.confirmPassword;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  // Define separate schemas for login and registration
  const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" })
  });

  const registrationSchema = formSchema;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Only require role for registration
    const validation = isLogin
      ? loginSchema.safeParse(formData)
      : registrationSchema.safeParse(formData);

    if (!validation.success) {
      validation.error.errors.forEach((error: any) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
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

        toast({
          title: "Success",
          description: "Login successful!",
        });
        onSuccess(profile); // No role check here
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
              role: formData.role
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
          // Try to get the created profile
          let profile;
          let profileError;
          const { data: fetchedProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          profile = fetchedProfile;
          profileError = fetchError;

          // If profile does not exist, insert it manually
          if (!profile) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                role: formData.role
              });
            if (insertError) {
              toast({
                title: "Error",
                description: "Failed to create user profile. Please contact support.",
                variant: "destructive"
              });
              setIsLoading(false);
              return;
            }
            // Fetch the profile again after insert
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
            profile = newProfile;
          }

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
            {isLogin ? 'Login' : 'Register'}
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
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={value => handleInputChange('role', value)} disabled={!!role}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(roleOption => (
                        <SelectItem key={roleOption} value={roleOption}>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select value={formData.city} onValueChange={value => handleInputChange('city', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(cityOption => (
                        <SelectItem key={cityOption} value={cityOption}>{cityOption}</SelectItem>
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

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
            </Button>

            {!isLogin && (
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => onSwitchMode('login')}
              >
                Already registered? Login
              </Button>
            )}
            {isLogin && (
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => onSwitchMode('register')}
              >
                Don't have an account? Register
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;
