import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[url('/sat2.webp')] p-6">
      <div className={cn("w-full max-w-md flex flex-col", className)}>
        {children}
      </div>
    </main>
  );
}
