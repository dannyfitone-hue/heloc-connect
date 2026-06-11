export default function OwnerLogin({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#06111f] px-6 text-white">
      <form action="/api/owner-login" method="post" className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#071421] p-8">
        <h1 className="text-3xl font-black">Owner Login</h1>
        {searchParams.error && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-red-200">Wrong password.</p>}
        <input type="hidden" name="next" value={searchParams.next || "/owner"} />
        <input name="password" type="password" placeholder="Owner password" className="mt-6 w-full rounded-2xl border border-white/15 bg-[#06101d] p-4" />
        <button className="mt-4 w-full rounded-2xl bg-[#f6c15a] p-4 font-black text-[#06111f]">Login</button>
      </form>
    </main>
  );
}
