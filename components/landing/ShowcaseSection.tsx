"use client";

import { useEffect, useRef, useState } from "react";
import { History, Settings, Container, Upload, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ImageShowcaseItem {
  type: "image";
  imageSrc: string;
  imageAlt: string;
  label: string;
  description: string;
  icon: ReactNode;
}

interface BestPracticeGroup {
  heading: string;
  points: string[];
  color: string; // text accent colour
}

interface TextShowcaseItem {
  type: "text";
  label: string;
  description: string;
  icon: ReactNode;
  groups: BestPracticeGroup[];
}

type ShowcaseItem = ImageShowcaseItem | TextShowcaseItem;

// ── Data ───────────────────────────────────────────────────────────────────

const items: ShowcaseItem[] = [
  {
    type: "image",
    imageSrc: "/landing/scan-history.png",
    imageAlt: "Scan History",
    label: "Scan History",
    description: "Browse and manage all past scan records",
    icon: <History size={16} />,
  },
  {
    type: "image",
    imageSrc: "/landing/setting.png",
    imageAlt: "Settings & Credentials",
    label: "Settings & Credentials",
    description: "Manage GitHub & Docker Hub tokens",
    icon: <Settings size={16} />,
  },
  {
    type: "image",
    imageSrc: "/landing/docker-template.png",
    imageAlt: "Docker Templates",
    label: "Docker Templates",
    description: "Pre-configured Dockerfile templates",
    icon: <Container size={16} />,
  },
  {
    type: "text",
    label: "Push to Docker Hub",
    description: "Best practices for secure image delivery",
    icon: <Upload size={16} />,
    groups: [
      {
        heading: "Tagging Strategy",
        color: "text-blue-600 dark:text-blue-400",
        points: [
          "Tag with semantic versions (v1.0.0)",
          "Keep :latest on newest stable build",
          "Tag by Git commit SHA for traceability",
        ],
      },
      {
        heading: "Security Before Push",
        color: "text-red-500 dark:text-red-400",
        points: [
          "Scan image with Trivy before every push",
          "Block pushes with Critical vulnerabilities",
          "Sign images with Docker Content Trust",
        ],
      },
      {
        heading: "Pipeline Efficiency",
        color: "text-emerald-600 dark:text-emerald-400",
        points: [
          "Use multi-stage builds to minimize size",
          "Layer COPY statements for cache efficiency",
          "Automate via CI/CD — never push manually",
        ],
      },
    ],
  },
];

// ── Card Components ─────────────────────────────────────────────────────────

function ImageCard({ item, index }: { item: ImageShowcaseItem; index: number }) {
  return (
    <div
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1 flex flex-col"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Screenshot */}
      <div className="flex-1 overflow-hidden">
        <img
          src={item.imageSrc}
          alt={item.imageAlt}
          className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
          loading="lazy"
        />
      </div>
      {/* Footer */}
      <div className="px-5 py-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 shrink-0">
          {item.icon}
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
        </div>
      </div>
    </div>
  );
}

function TextCard({ item, index }: { item: TextShowcaseItem; index: number }) {
  return (
    <div
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden"
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Dark header */}
      <div className="bg-slate-900 dark:bg-slate-800 px-6 py-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Best Practices</p>
        <h3 className="text-lg font-bold text-white">Push to Docker Hub</h3>
      </div>

      {/* 3-column best-practice grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
        {item.groups.map((group) => (
          <div key={group.heading} className="px-6 py-5">
            <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${group.color}`}>
              {group.heading}
            </p>
            <ul className="space-y-3">
              {group.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 shrink-0">
          {item.icon}
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-900 dark:text-white">{item.label}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────

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

  const imageItems = items.filter((i): i is ImageShowcaseItem => i.type === "image");
  const textItem   = items.find((i): i is TextShowcaseItem   => i.type === "text")!;

  return (
    <section
      id="showcase"
      ref={ref}
      className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Platform{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Overview
            </span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            From scan history and credential management to secure image delivery — everything in one place.
          </p>
        </div>

        {/* 2×2 Grid — all cards equal height */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {imageItems.map((item, idx) => (
            <ImageCard key={item.label} item={item} index={idx} />
          ))}
          <TextCard item={textItem} index={imageItems.length} />
        </div>
      </div>
    </section>
  );
}
