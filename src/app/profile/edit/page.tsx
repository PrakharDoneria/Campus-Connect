
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
import { createCircle, getCircles } from '@/lib/actions/circle.actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, LocateFixed, Trash2, Plus } from 'lucide-react';
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
  const { user, dbUser, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [nearbyCircles, setNearbyCircles] = useState<ICircle[]>([]);
  const [isCreatingCircle, setIsCreatingCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [isCircleDialogOpen, setIsCircleDialogOpen] = useState(false);


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
          description: 'Great! We now know where to find you. Kidding... mostly.',
        });
        fetchNearbyCircles(latitude, longitude);
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
  
    const fetchNearbyCircles = async (lat: number, long: number) => {
        // This is a simplified version. A real app would have an endpoint
        // to get circles near a specific location. For now, we get all and filter.
        const allCircles = await getCircles();
        setNearbyCircles(allCircles.slice(0, 5)); // show top 5 as a demo
    }
    
    const handleCreateCircle = async () => {
        if (!newCircleName.trim() || !newCircleDescription.trim() || !user) {
            toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
            return;
        }

        setIsCreatingCircle(true);
        try {
            const newCircle = await createCircle({ name: newCircleName, description: newCircleDescription }, user.uid);
            toast({ title: "Success", description: `Circle "c/${newCircle.name}" created.` });
            setNewCircleName('');
            setNewCircleDescription('');
            setIsCircleDialogOpen(false);
            setNearbyCircles(prev => [newCircle, ...prev]);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingCircle(false);
        }
    }


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
        router.push(`/profile/${dbUser?._id}`);
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
        await deleteUserAccount(user.uid);
        toast({
            title: "Account Deleted",
            description: "Your account has been permanently deleted. We're sad to see you go!",
        });
        await signOut(); // This will sign out from Firebase and redirect
    } catch(error) {
        console.error("Failed to delete account:", error);
        toast({
            title: "Error",
            description: "Could not delete your account. Please try again.",
            variant: "destructive",
        });
        setIsDeleting(false);
    }
  }

  if (!user || !dbUser) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
             <Card className="w-full max-w-lg">
                <CardHeader>
                    <Shimmer className="h-8 w-3/4" />
                    <Shimmer className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Shimmer className="h-4 w-1/4" />
                        <Shimmer className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Shimmer className="h-4 w-1/4" />
                        <Shimmer className="h-10 w-full" />
                    </div>
                    <Shimmer className="h-10 w-full" />
                    <Shimmer className="h-10 w-full" />
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
            {isInitialSetup ? "Just a few more details and you're in. We promise it's less painful than a pop quiz." : 'Keep your details up-to-date.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
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
                        We need your location to find nearby students. Don't worry, we won't stalk you.
                    </p>
                    <Button
                        type="button"
                        variant={coordinates ? "secondary" : "default"}
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="w-full"
                    >
                        {isDetectingLocation ? <Loader2 className="animate-spin" /> : <LocateFixed />}
                        {coordinates ? 'Location Detected!' : 'Detect My Location'}
                    </Button>
                    {coordinates && (
                        <p className="text-xs text-center text-green-600">
                            Got it! You can now save your profile.
                        </p>
                    )}
                </div>
            </div>

            {isInitialSetup && nearbyCircles.length > 0 && (
                <div className="space-y-2 rounded-lg border p-4">
                     <Label>Join Nearby Circles</Label>
                     <p className="text-sm text-muted-foreground pb-2">
                        Get started by joining some popular circles near you.
                    </p>
                    <div className="space-y-2">
                        {nearbyCircles.map(circle => (
                            <div key={circle.name} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-semibold">c/{circle.name}</p>
                                    <p className="text-xs text-muted-foreground">{circle.description}</p>
                                </div>
                                <Button size="sm" variant="outline">Join</Button>
                            </div>
                        ))}
                         <Dialog open={isCircleDialogOpen} onOpenChange={setIsCircleDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4"/>Create Your Own Circle</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create a new Circle</DialogTitle>
                                    <DialogDescription>
                                        Can't find a circle for your college? Create one!
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="circle-name">Circle Name</Label>
                                        <div className="flex items-center">
                                            <span className="p-2 bg-muted rounded-l-md text-muted-foreground">c/</span>
                                            <Input 
                                                id="circle-name" 
                                                value={newCircleName} 
                                                onChange={(e) => setNewCircleName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                                className="rounded-l-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="circle-description">Description</Label>
                                        <Textarea 
                                            id="circle-description"
                                            value={newCircleDescription}
                                            onChange={(e) => setNewCircleDescription(e.target.value)}
                                            placeholder="What is this circle about?"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCircleDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleCreateCircle} disabled={isCreatingCircle}>
                                        {isCreatingCircle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Circle
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !coordinates}>
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
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account, posts, comments, and all other data.
            </AlertDialogDescription>
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
