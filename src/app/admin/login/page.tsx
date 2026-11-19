import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-5xl">🎡</div>
        <h1 className="mt-3 text-2xl font-extrabold">Lucky Draw Admin</h1>
      </div>
      <LoginForm next={next ?? "/admin"} />
    </main>
  );
}
