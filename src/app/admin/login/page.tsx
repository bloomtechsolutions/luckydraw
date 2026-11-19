import LoginForm from "./LoginForm";
import Logo from "@/components/Logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="bg-stadium flex min-h-dvh flex-col justify-center px-4"><div className="mx-auto w-full max-w-sm">
      <div className="mb-6 text-center">
        <Logo variant="full" className="animate-float mx-auto h-36 w-auto text-white" />
        <h1 className="mt-5 text-2xl font-extrabold">Lucky Draw Admin</h1>
      </div>
      <LoginForm next={next ?? "/admin"} />
    </div></main>
  );
}
