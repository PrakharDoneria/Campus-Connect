
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateUser, deleteUserAccount } from '@/lib/actions/user.actions';
import { createCircle, getCircles, getCircleByName, joinCircle } from '@/lib/actions/circle.actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, LocateFixed, Trash2, Plus, Search } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Gender, ICircle } from '@/types';
import { useRouter } from 'next/navigation';
import { Shimmer } from '@/components/common/Shimmer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

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
  const { user, dbUser, signOut, refreshDbUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [universityCircle, setUniversityCircle] = useState<ICircle | null>(null);
  const [isCircleLoading, setIsCircleLoading] = useState(false);
  const [isJoiningCircle, setIsJoiningCircle] = useState(false);


  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      university: '',
      major: '',
    },
  });

  const watchedUniversity = watch('university');

  const findUniversityCircle = useCallback(async (universityName: string) => {
    if (!universityName) return;
    setIsCircleLoading(true);
    try {
      const circleName = universityName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const circle = await getCircleByName(circleName);
      setUniversityCircle(circle);
    } catch (error) {
      console.error("Failed to check for university circle", error);
      setUniversityCircle(null);
    } finally {
      setIsCircleLoading(false);
    }
  }, []);

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
      if (dbUser.university) {
          findUniversityCircle(dbUser.university);
      }
    }
  }, [dbUser, setValue, findUniversityCircle]);

  useEffect(() => {
      const subscription = watch((value, { name, type }) => {
        if (name === 'university' && type === 'change') {
            findUniversityCircle(value.university as string);
        }
    });
    return () => subscription.unsubscribe();
  }, [watch, findUniversityCircle]);

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
        setIsDetectingLocation(false);
        toast({ title: 'Location Detected!' });
      },
      (error) => {
        setIsDetectingLocation(false);
        let description = 'Could not get your location.';
        if (error.code === error.PERMISSION_DENIED) {
            description = 'Location permission denied. Please enable it in browser settings.'
        }
        toast({ title: 'Location Error', description, variant: 'destructive' });
      }
    );
  };
    
    const handleJoinUniversityCircle = async () => {
        if (!user || !universityCircle) return;
        setIsJoiningCircle(true);
        try {
            await joinCircle(user.uid, universityCircle.name);
            await updateUser(user.uid, { universityCircle: universityCircle.name });
            toast({ title: "Joined Circle!", description: `You are now a member of c/${universityCircle.name}.` });
            await refreshDbUser(); // Refresh user data in context
        } catch (error) {
            toast({ title: 'Error', description: 'Could not join the circle.', variant: 'destructive' });
        } finally {
            setIsJoiningCircle(false);
        }
    }
    
    const handleCreateUniversityCircle = async () => {
        if (!user || !watchedUniversity) return;
        
        const circleName = watchedUniversity.toLowerCase().replace(/[^a-z0-9]/g, '');
        const circleDescription = `The official community for ${watchedUniversity}.`;

        setIsJoiningCircle(true);
        try {
            const newCircle = await createCircle({ name: circleName, description: circleDescription }, user.uid);
            await updateUser(user.uid, { universityCircle: newCircle.name });
            toast({ title: "Circle Created!", description: `You've founded c/${newCircle.name}.` });
            setUniversityCircle(newCircle);
            await refreshDbUser(); // Refresh user data in context
        } catch (error: any) {
             toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
             setIsJoiningCircle(false);
        }
    }


  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    
    if (!coordinates) {
        toast({ title: 'Location is required', description: 'Please detect your location.', variant: 'destructive' });
        return;
    }

    if (!dbUser?.universityCircle && watchedUniversity) {
        toast({ title: 'University Circle Required', description: 'Please join or create your university circle.', variant: 'destructive' });
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

      toast({ title: 'Profile Updated!', description: "Your profile is all set." });

      if (!dbUser?.university) { // This is initial setup
        window.location.href = '/feed';
      } else {
        router.push(`/profile/${dbUser?._id}`);
      }

    } catch (error) {
      toast({ title: 'Update Failed', description: 'Could not update your profile.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
        await deleteUserAccount(user.uid);
        toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        await signOut();
    } catch(error) {
        toast({ title: "Error", description: "Could not delete your account.", variant: "destructive" });
        setIsDeleting(false);
    }
  }

  if (!user || !dbUser) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
             <Card className="w-full max-w-lg">
                <CardHeader><Shimmer className="h-8 w-3/4" /><Shimmer className="h-4 w-1/2" /></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Shimmer className="h-4 w-1/4" /><Shimmer className="h-10 w-full" /></div>
                     <div className="space-y-2"><Shimmer className="h-4 w-1/4" /><Shimmer className="h-10 w-full" /></div>
                    <Shimmer className="h-10 w-full" /><Shimmer className="h-10 w-full" />
                </CardContent>
             </Card>
        </div>
    );
  }
  
  const isInitialSetup = !dbUser.university;

  return (
    <>
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{isInitialSetup ? 'Finish Your Profile' : 'Edit Your Profile'}</CardTitle>
          <CardDescription>
            {isInitialSetup ? "Just a few more details and you're in." : 'Keep your details up-to-date.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Controller name="university" control={control} render={({ field }) => <Input id="university" {...field} />} />
                {errors.university && <p className="text-sm text-destructive">{errors.university.message}</p>}
                </div>
                
                {watchedUniversity && (
                    <div className="space-y-2 rounded-lg border p-4">
                        <Label>University Circle</Label>
                         <p className="text-sm text-muted-foreground pb-2">
                            This is your home base on campus. Join your university's official circle.
                        </p>
                        {isCircleLoading ? <Shimmer className="h-10 w-full" /> : (
                            dbUser.universityCircle ? (
                                <Button variant="secondary" className="w-full" disabled>Joined c/{dbUser.universityCircle}</Button>
                            ) : universityCircle ? (
                                <Button type="button" onClick={handleJoinUniversityCircle} disabled={isJoiningCircle} className="w-full">
                                    {isJoiningCircle ? <Loader2 className="animate-spin" /> : <Plus />}
                                    Join c/{universityCircle.name}
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleCreateUniversityCircle} disabled={isJoiningCircle} className="w-full">
                                     {isJoiningCircle ? <Loader2 className="animate-spin" /> : <Plus />}
                                    Create c/{watchedUniversity.toLowerCase().replace(/[^a-z0-9]/g, '')}
                                </Button>
                            )
                        )}
                    </div>
                )}
                
                <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Controller name="major" control={control} render={({ field }) => <Input id="major" {...field} />} />
                {errors.major && <p className="text-sm text-destructive">{errors.major.message}</p>}
                </div>
                
                <div className="space-y-2">
                <Label>Gender</Label>
                <Controller name="gender" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other">Other</Label></div>
                    </RadioGroup>
                )}/>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                </div>

                <div className="space-y-2 rounded-lg border p-4">
                    <Label>Your Location</Label>
                    <p className="text-sm text-muted-foreground pb-2">We need your location to find nearby students.</p>
                    <Button type="button" variant={coordinates ? "secondary" : "default"} onClick={handleDetectLocation} disabled={isDetectingLocation} className="w-full">
                        {isDetectingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                        {coordinates ? 'Location Detected!' : 'Detect My Location'}
                    </Button>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !coordinates || (!dbUser.universityCircle && isInitialSetup) }>
              {isSubmitting ? <Loader2 className="animate-spin" /> : isInitialSetup ? 'Save and Continue' : 'Save Changes' }
            </Button>
          </form>
           {!isInitialSetup && (
            <>
                <Separator className="my-6" />
                <div className="space-y-3">
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                <div className="rounded-lg border border-destructive p-4">
                    <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-semibold">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all of your content.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteAlert(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                    </div>
                </div>
                </div>
            </>
           )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete your account, posts, comments, and all other data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
