
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
import { createCircle, getCircles, getCircleByName, joinCircle, searchCircles } from '@/lib/actions/circle.actions';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, LocateFixed, Trash2, Plus, Search, Github, Linkedin, Facebook } from 'lucide-react';
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
  socials: z.object({
      github: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

type Coordinates = {
  latitude: number;
  longitude: number;
};

function InstagramIcon(props: any) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    )
}

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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ICircle[]>([]);
  const [isSearching, setIsSearching] = useState(false);


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
      socials: {
        github: '',
        linkedin: '',
        instagram: '',
        facebook: '',
      }
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
    if (searchQuery.trim().length > 2) {
      const performSearch = async () => {
        setIsSearching(true);
        const results = await searchCircles(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      };
      const debounce = setTimeout(performSearch, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (dbUser) {
      setValue('university', dbUser.university || '');
      setValue('major', dbUser.major || '');
      setValue('gender', dbUser.gender as Gender);
      setValue('socials', dbUser.socials || {});
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
    
    const handleJoinUniversityCircle = async (circleToJoin: ICircle) => {
        if (!user || !circleToJoin) return;
        setIsJoiningCircle(true);
        try {
            await joinCircle(user.uid, circleToJoin.name);
            await updateUser(user.uid, { universityCircle: circleToJoin.name });
            toast({ title: "Joined Circle!", description: `You are now a member of c/${circleToJoin.name}.` });
            await refreshDbUser(); // Refresh user data in context
            setIsSearchOpen(false); // Close search dialog
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
        socials: data.socials,
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
                        <div className="flex justify-between items-center">
                            <div>
                                <Label>University Circle</Label>
                                <p className="text-sm text-muted-foreground pb-2">
                                    Join your university's official community.
                                </p>
                            </div>
                            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon"><Search className="h-4 w-4" /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Search for a Circle</DialogTitle>
                                    </DialogHeader>
                                    <Input placeholder="Type to search circles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {isSearching && <Loader2 className="mx-auto animate-spin" />}
                                        {searchResults.map(circle => (
                                            <div key={circle.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                                <div>
                                                    <p className="font-semibold">c/{circle.name}</p>
                                                    <p className="text-sm text-muted-foreground">{circle.description}</p>
                                                </div>
                                                <Button size="sm" onClick={() => handleJoinUniversityCircle(circle)} disabled={isJoiningCircle}>Join</Button>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {isCircleLoading ? <Shimmer className="h-10 w-full" /> : (
                            dbUser.universityCircle ? (
                                <Button variant="secondary" className="w-full" disabled>Joined c/{dbUser.universityCircle}</Button>
                            ) : universityCircle ? (
                                <Button type="button" onClick={() => handleJoinUniversityCircle(universityCircle)} disabled={isJoiningCircle} className="w-full">
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
            
             <Separator />

             <div className="space-y-4">
                <Label>Social Profiles</Label>
                <div className="space-y-2">
                    <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="socials.github" control={control} render={({ field }) => <Input {...field} placeholder="github.com/username" className="pl-9" />} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="socials.linkedin" control={control} render={({ field }) => <Input {...field} placeholder="linkedin.com/in/username" className="pl-9" />} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="relative">
                        <InstagramIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="socials.instagram" control={control} render={({ field }) => <Input {...field} placeholder="instagram.com/username" className="pl-9" />} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Controller name="socials.facebook" control={control} render={({ field }) => <Input {...field} placeholder="facebook.com/username" className="pl-9" />} />
                    </div>
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
