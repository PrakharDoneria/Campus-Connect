import { GraduationCap, Compass, Users, MessageSquare } from 'lucide-react';

export default function LoadingScreen() {
  const icons = [
    { icon: <GraduationCap className="h-8 w-8" />, key: 'grad-cap' },
    { icon: <Compass className="h-8 w-8" />, key: 'compass' },
    { icon: <Users className="h-8 w-8" />, key: 'users' },
    { icon: <MessageSquare className="h-8 w-8" />, key: 'message' },
  ];

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-background">
      <div className="relative h-40 w-40">
        {icons.map((item, index) => (
          <div
            key={item.key}
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/10 text-primary"
            style={{
              animation: `orbit 8s linear infinite`,
              animationDelay: `${index * -2}s`,
              transformOrigin: '0 0',
            }}
          >
            {item.icon}
          </div>
        ))}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <GraduationCap className="h-16 w-16 animate-pulse text-primary" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary">Campus Connect</h2>
        <p className="text-muted-foreground">Brewing coffee and loading your campus...</p>
      </div>
      <style jsx>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(80px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(80px) rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}
