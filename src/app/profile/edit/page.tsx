
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
import { useState, useEffect } from 'react';
import { Loader2, LocateFixed } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Gender } from '@/types';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  university: z.string().min(1, 'University is required'),
  major: z.string().min(1, 'Major is required'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select your gender.',
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type Coordinates = {
  latitude: number;
  longitude: number;
};

export default function ProfileEditPage() {
  const { user, dbUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      university: '',
      major: '',
    },
  });

  useEffect(() => {
    if (dbUser) {
      setValue('university', dbUser.university || '');
      setValue('major', dbUser.major || '');
      setValue('gender', dbUser.gender);
      if (dbUser.location) {
        setCoordinates({
            latitude: dbUser.location.coordinates[1],
            longitude: dbUser.location.coordinates[0]
        })
      }
    }
  }, [dbUser, setValue]);

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
          description: 'Aakashvani from the sky says we got you.',
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
    
    const isInitialProfileCompletion = !dbUser?.university;

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
        gender: data.gender as Gender,
        location: {
          type: 'Point' as const,
          coordinates: [coordinates.longitude, coordinates.latitude] as [number, number],
        },
      };

      await updateUser(user.uid, updatedUserData);

      toast({
        title: 'Profile Updated!',
        description: "You're all set! Time to connect.",
      });

      if (isInitialProfileCompletion) {
        window.location.href = '/feed';
      } else {
        router.push('/profile');
      }

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
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
             <Card className="w-full max-w-md">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
             </Card>
        </div>
    );
  }
  
  const isInitialSetup = !dbUser.university;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{isInitialSetup ? 'Finish your KYC...' : 'Edit Your Profile'}</CardTitle>
          <CardDescription>
            {isInitialSetup ? 'Just kidding! But please fill this out so we can find your tribe.' : 'Keep your details up-to-date.'}
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
              <Label>Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
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
              {isSubmitting ? <Loader2 className="animate-spin" /> : isInitialSetup ? 'Save and Continue' : 'Save Changes' }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
