import { AuthHeader } from "@/components/auth/auth-header";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm bg-background p-8">
        <AuthHeader />
        {children}
      </div>
    </main>
  );
}
