export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-muted ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-muted via-gray-300/20 to-muted"></div>
    </div>
  );
}

// Enhance your tailwind.config.ts with this animation
// @keyframes shimmer {
//   100% {
//     transform: translateX(100%);
//   }
// }
// animation: {
//   shimmer: 'shimmer 2s infinite',
// }