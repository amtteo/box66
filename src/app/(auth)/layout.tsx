import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            Box66
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Franšízová platforma
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
