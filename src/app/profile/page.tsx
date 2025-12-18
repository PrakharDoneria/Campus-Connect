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
import { useState, useEffect } from 'react';
import { Loader2, LocateFixed } from 'lucide-react';
import { getLocationCoordinates } from '@/ai/flows/location-input-assistance';

const profileSchema = z.object({
  university: z.string().min(1, 'University is required'),
  major: z.string().min(1, 'Major is required'),
  address: z.string(), // No longer strictly required if coords are fetched
});

type ProfileFormData = z.infer<typeof profileSchema>;

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function ProfilePage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      university: dbUser?.university || '',
      major: dbUser?.major || '',
      address: '',
    },
  });

  const addressValue = watch('address');

  // If user types an address, clear coordinates to re-enable AI lookup
  useEffect(() => {
    if (addressValue) {
      setCoordinates(null);
    }
  }, [addressValue]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: "Your browser doesn't support location services.",
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        setValue('address', 'Location detected successfully!');
        setIsDetectingLocation(false);
        toast({
          title: 'Location Detected',
          description: 'Your coordinates have been captured.',
        });
      },
      (error) => {
        setIsDetectingLocation(false);
        toast({
          title: 'Location Error',
          description: error.message || 'Could not get your location. Please enter an address manually.',
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

    if (!coordinates && !data.address) {
        toast({
            title: 'Location is required',
            description: 'Please detect your location or enter an address.',
            variant: 'destructive'
        });
        return;
    }

    setIsSubmitting(true);
    try {
      let locationResult: Coordinates;

      if (coordinates) {
        // Use auto-detected coordinates
        locationResult = coordinates;
      } else {
        // Fallback to AI geocoding
        locationResult = await getLocationCoordinates({ address: data.address });
      }
      
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
                <div className="flex items-center gap-2">
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => (
                        <Input 
                            id="address" 
                            placeholder="e.g., 'Main Library, Example University'"
                            {...field} 
                            disabled={!!coordinates}
                        />
                        )}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        aria-label="Detect location"
                    >
                        {isDetectingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Click the icon to detect your location, or enter an address/landmark for our AI to find you.
                </p>
                {errors.address && !coordinates && <p className="text-sm text-destructive">{errors.address.message}</p>}
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
