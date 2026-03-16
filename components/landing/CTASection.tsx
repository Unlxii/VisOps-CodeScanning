"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface CTASectionProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export default function CTASection({ onSignIn, isLoading }: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 dark:from-slate-800 dark:via-blue-900/80 dark:to-indigo-900/80 rounded-3xl px-8 py-16 md:px-16 md:py-24 text-center overflow-hidden transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Ready to Secure Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Code & Containers?
              </span>
            </h2>

            <p className="text-lg text-blue-200/80 max-w-xl mx-auto mb-10 leading-relaxed">
              Start scanning your repositories for vulnerabilities, 
              building secure Docker images, and shipping with confidence.
            </p>

            <button
              onClick={onSignIn}
              disabled={isLoading}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-base rounded-xl hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in with CMU Account
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
