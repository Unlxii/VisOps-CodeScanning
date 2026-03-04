"use client";

import { ArrowRight, Loader2, Shield, GitBranch, Lock } from "lucide-react";

interface HeroSectionProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export default function HeroSection({ onSignIn, isLoading }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-blue-400/20 via-indigo-400/10 to-transparent rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 text-center">


        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-slate-900 dark:text-white">Automate & </span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Improve
          </span>
          <br />
          <span className="text-slate-900 dark:text-white">Your Security Scans</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          Scan code for vulnerabilities, build Docker images securely, and ship with confidence.
          All in one platform designed for modern dev teams.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white font-semibold text-base rounded-xl hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-600/20 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2"> 
              <img 
                src="/cmu-logo.png" 
                alt="CMU Logo"
                className="w-7 h-7 object-contain" 
              />
              
              <span>Sign in with CMU Account</span>

              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 mb-16 animate-in fade-in duration-700 delay-300">
          {[
            { icon: Shield,    label: "Detect Vulnerabilities",   value: "Gitleaks · Semgrep" },
            { icon: GitBranch, label: "Container Scanning",        value: "Trivy" },
            { icon: Lock,      label: "Build & Push to Docker",    value: "Docker Hub Registry" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <stat.icon size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Screenshot */}
        <div className="relative max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-500">
          {/* Browser Chrome */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-t-2xl px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-slate-800 dark:bg-slate-700 rounded-md px-4 py-1 text-xs text-slate-400 text-center max-w-sm mx-auto">
                visscan/dashboard
              </div>
            </div>
          </div>
          {/* Screenshot */}
          <div className="bg-white dark:bg-slate-900 rounded-b-2xl border border-t-0 border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl shadow-slate-900/20 dark:shadow-black/40">
            <img
              src="/landing/dashboard.png"
              alt="VisScan Dashboard"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/10 via-indigo-400/10 to-purple-400/10 rounded-3xl blur-2xl -z-10" />
        </div>
      </div>
    </section>
  );
}
