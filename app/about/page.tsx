export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black text-[#7CFF00] mb-8">
          About HELOC CONNECT
        </h1>

        <p className="text-xl text-zinc-300 leading-9 mb-8">
          HELOC CONNECT is a homeowner-focused mortgage marketing and lead
          generation platform designed to help users explore home equity
          solutions through a streamlined and transparent process.
        </p>

        <p className="text-lg text-zinc-400 leading-8 mb-6">
          Our platform connects homeowners with lending opportunities through a
          trusted network of participating mortgage professionals and financial
          service providers.
        </p>

        <p className="text-lg text-zinc-400 leading-8 mb-6">
          We focus on fast response times, simplified intake experiences,
          secure data handling, and educational support so users can better
          understand available home equity options.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-bold text-[#7CFF00] mb-2">
              Secure Process
            </h3>
            <p className="text-zinc-400">
              Protected forms and encrypted communication pathways.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-bold text-[#7CFF00] mb-2">
              Trusted Network
            </h3>
            <p className="text-zinc-400">
              Access to experienced mortgage professionals and lending partners.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-bold text-[#7CFF00] mb-2">
              Fast Support
            </h3>
            <p className="text-zinc-400">
              Quick communication and homeowner assistance throughout the process.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
