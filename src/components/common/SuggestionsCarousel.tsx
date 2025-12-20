
'use client';

import { IUser } from '@/types';
import { Card } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { UserCard } from './UserCard';

export function SuggestionsCarousel({ users }: { users: IUser[] }) {
  if (!users || users.length === 0) {
    return null;
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
        dragFree: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2">
        {users.map((user) => (
          <CarouselItem key={user.uid} className="basis-1/3 md:basis-1/4 lg:basis-1/5 pl-2">
            <Card className="overflow-hidden transition-all hover:shadow-md h-full">
                <UserCard user={user} variant="compact" />
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  );
}

    