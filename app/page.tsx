'use client';

import { useState } from 'react';

export default function Home() {
  // Your existing Smart Calculator state and logic goes here
  // (I'm keeping it as a placeholder - paste your full calculator code below this hero section)

  return (
    <main className="bg-[#06111f] text-white min-h-screen overflow-hidden">
      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#06111f]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black tracking-tighter text-amber-400">HELOC</div>
            <div className="text-xl font-bold">CONNECT</div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how">How It Works</a>
            <a href="#network">Our Network</a>
            <a href="#shield">Protection Shield</a>
            <a href="#calculator">Calculator</a>
          </div>
          <a href="#calculator" className="bg-amber-400 hover:bg-amber-300 text-black px-6 py-3 rounded-2xl font-semibold transition">
            Get Started
          </a>
        </div>
      </nav>

      {/* Dramatic Luxury Hero */}
      <section className="pt-24 pb-20 relative hero-premium min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-amber-400/30 bg-white/5 text-amber-400 text-sm font-semibold">
              THE SMARTER WAY TO BORROW
            </div>

            <h1 className="text-6xl md:text-7xl font-black leading-none tracking-tighter">
              HELOC or Refinance?<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400">Find the smarter path.</span>
            </h1>

            <p className="text-xl text-slate-300 max-w-lg">
              We help homeowners unlock equity and lower payments by connecting them with carefully selected mortgage companies — with full transparency and Protection Shield.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="glass-card px-6 py-4 rounded-2xl text-sm border border-amber-400/30">100% Free for Homeowners</div>
              <div className="glass-card px-6 py-4 rounded-2xl text-sm border border-amber-400/30">No SSN Required</div>
              <div className="glass-card px-6 py-4 rounded-2xl text-sm border border-amber-400/30">Protection Shield</div>
            </div>

            <div className="flex items-center gap-8">
              <div>⭐⭐⭐⭐⭐ <span className="text-amber-400">4.9/5 from 2,000+ homeowners</span></div>
              <div>Featured on Yahoo Finance</div>
            </div>
          </div>

          <div className="hidden md:block">
            <img 
              src="/heloc-office-consultation-final.png" 
              alt="HELOC CONNECT Premium Consultation" 
              className="rounded-3xl shadow-2xl" 
            />
          </div>
        </div>
      </section>

      {/* Your Smart Calculator - KEEP YOUR FULL CALCULATOR CODE HERE */}
      <section id="calculator" className="py-20 bg-[#0a1728]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="glass-card p-8 md:p-12 rounded-3xl">
            {/* PASTE YOUR ENTIRE EXISTING SMART CALCULATOR FORM HERE */}
            {/* Everything from your original page.tsx calculator stays exactly the same */}
          </div>
        </div>
      </section>

      {/* Real Results Section */}
      <section className="py-20 bg-[#06111f]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black mb-4">Real Results for Real Homeowners</h2>
          <p className="text-slate-400 mb-16">See how much you could save</p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="glass-card p-10 rounded-3xl text-left">
              <p className="text-red-400 mb-2">PREVIOUS MORTGAGE</p>
              <div className="text-6xl font-bold">$2,785/mo</div>
              <p className="text-slate-400">$0 Cash Out</p>
            </div>
            <div className="glass-card p-10 rounded-3xl text-left border-2 border-amber-400 relative">
              <div className="absolute -top-5 right-8 bg-amber-400 text-black px-8 py-2 rounded-full font-bold">NEW MATCH</div>
              <p className="text-emerald-400 mb-2">WITH HELOC CONNECT</p>
              <div className="text-6xl font-bold">$2,125/mo</div>
              <p className="text-emerald-400">+ $100,000 Cash Access</p>
              <p className="mt-8 text-emerald-400 text-xl font-medium">$660 saved monthly • $100k at closing</p>
            </div>
          </div>
        </div>
      </section>

      {/* More Trust / CTA */}
      <section className="py-20 bg-[#0a1728]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to explore your best options?</h2>
          <a href="#calculator" className="inline-block bg-amber-400 hover:bg-amber-300 text-black px-12 py-5 rounded-2xl text-xl font-semibold">
            Start with the Smart Calculator →
          </a>
        </div>
      </section>
    </main>
  );
}
