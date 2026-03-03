"use client";

import { useEffect, useRef, useState } from "react";
import { History, Settings, Container, Users } from "lucide-react";
import type { ReactNode } from "react";

interface ShowcaseItem {
  imageSrc: string;
  imageAlt: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const items: ShowcaseItem[] = [
  {
    imageSrc: "/landing/scan-history.png",
    imageAlt: "Scan History",
    label: "Scan History",
    description: "Browse and manage all past scan records",
    icon: <History size={16} />,
  },
  {
    imageSrc: "/landing/setting.png",
    imageAlt: "Settings & Credentials",
    label: "Settings & Credentials",
    description: "Manage GitHub & Docker Hub tokens",
    icon: <Settings size={16} />,
  },
  {
    imageSrc: "/landing/docker-template.png",
    imageAlt: "Docker Templates",
    label: "Docker Templates",
    description: "Pre-configured Dockerfile templates",
    icon: <Container size={16} />,
  },
  {
    imageSrc: "/landing/user-management.png",
    imageAlt: "User Management",
    label: "User Management",
    description: "Admin tools for user approval & roles",
    icon: <Users size={16} />,
  },
];

export default function ShowcaseSection() {
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
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="showcase"
      ref={ref}
      className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Platform{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Overview
            </span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            From scan history and credential management to admin tools — everything in one place.
          </p>
        </div>

        {/* 2×2 Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-1000 delay-200 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          {items.map((item, index) => (
            <div
              key={item.label}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="overflow-hidden">
                <img
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              {/* Label */}
              <div className="px-5 py-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                  {item.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
