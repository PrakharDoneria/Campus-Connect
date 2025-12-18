'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateUser } from '@/lib/actions/user.actions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getLocationCoordinates } from '@/ai/flows/location-input-assistance';

const profileSchema = z.object({
  university: z.string().min(1, 'University is required'),
  major: z.string().min(1, 'Major is required'),
  address: z.string().min(1, 'Your address or a nearby landmark is required for geolocation.'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      university: dbUser?.university || '',
      major: dbUser?.major || '',
      address: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Get coordinates from AI
      const locationResult = await getLocationCoordinates({ address: data.address });
      
      // Step 2: Update user in DB
      const updatedUserData = {
        university: data.university,
        major: data.major,
        location: {
          type: 'Point',
          coordinates: [locationResult.longitude, locationResult.latitude],
        },
      };

      await updateUser(user.uid, updatedUserData);

      toast({
        title: 'Profile Updated!',
        description: 'Your profile is now complete.',
      });

      // Force a reload to re-run the auth checks with the completed profile
      window.location.href = '/feed';

    } catch (error) {
      console.error('Profile update failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !dbUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome to Campus Connect! Please fill out the details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Controller
                name="university"
                control={control}
                render={({ field }) => <Input id="university" {...field} />}
              />
              {errors.university && <p className="text-sm text-destructive">{errors.university.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Controller
                name="major"
                control={control}
                render={({ field }) => <Input id="major" {...field} />}
              />
              {errors.major && <p className="text-sm text-destructive">{errors.major.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Your Location</Label>
               <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="address" 
                    placeholder="e.g., 'Main Library, Example University'"
                    {...field} 
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                We use AI to find your coordinates. Provide an address or a well-known campus landmark.
              </p>
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
