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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, LocateFixed } from 'lucide-react';

const profileSchema = z.object({
  university: z.string().min(1, 'University is required'),
  major: z.string().min(1, 'Major is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function ProfilePage() {
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      university: dbUser?.university || '',
      major: dbUser?.major || '',
    },
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: "Your browser doesn't support location services. Please use a different browser.",
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        setIsDetectingLocation(false);
        toast({
          title: 'Location Detected!',
          description: 'Your location has been saved.',
        });
      },
      (error) => {
        setIsDetectingLocation(false);
        let description = 'Could not get your location. Please try again.';
        if (error.code === error.PERMISSION_DENIED) {
            description = 'Location permission denied. Please enable it in your browser settings to continue.'
        }
        toast({
          title: 'Location Error',
          description: description,
          variant: 'destructive',
        });
      }
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive',
      });
      return;
    }

    if (!coordinates) {
        toast({
            title: 'Location is required',
            description: 'Please detect your location to continue.',
            variant: 'destructive'
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const updatedUserData = {
        university: data.university,
        major: data.major,
        location: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude],
        },
      };

      await updateUser(user.uid, updatedUserData);

      toast({
        title: 'Profile Updated!',
        description: 'Your profile is now complete.',
      });

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
            
            <div className="space-y-2 rounded-lg border p-4">
                 <Label>Your Location</Label>
                 <p className="text-sm text-muted-foreground pb-2">
                    We need your location to connect you with students nearby.
                </p>
                <Button
                    type="button"
                    variant={coordinates ? "secondary" : "default"}
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full"
                >
                    {isDetectingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                    {coordinates ? 'Location Detected Successfully' : 'Detect My Location'}
                </Button>
                {coordinates && (
                    <p className="text-xs text-center text-green-600">
                        You can now save your profile.
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !coordinates}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
