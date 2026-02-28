// app/dashboard/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  Loader2,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Shield,
  Package,
  ExternalLink,
  Eye,
  Folder,
  Server,
  GitBranch,
  MoreHorizontal,
  Play,
  Tag,
  X,
  Search,
} from "lucide-react";
import AddServiceDialog from "@/components/AddServiceDialog";
import Tooltip from "@/components/ui/Tooltip";
import { ScanModeBadge, StatusBadge } from "@/components/pipeline/StatusBadges";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectCard from "@/components/CreateProjectCard";

// --- Types ---
interface Project {
  id: string;
  groupName: string;
  repoUrl: string;
  isActive: boolean;
  services: Service[];
  createdAt: string;
}

interface Service {
  id: string;
  serviceName: string;
  imageName: string;
  contextPath: string;
  scans: ScanHistory[];
}

interface ScanHistory {
  id: string;
  pipelineId: string | null;
  status: string;
  scanMode: string; // "SCAN_ONLY" | "SCAN_AND_BUILD"
  imageTag: string;
  vulnCritical: number;
  vulnHigh: number;
  vulnMedium: number;
  vulnLow: number;
  startedAt: string;
  completedAt: string | null;
}

interface ActiveScan {
  id: string;
  pipelineId: string | null;
  status: string;
  service?: {
    serviceName: string;
    imageName: string;
  };
  startedAt: string;
}

// --- Fetcher with no-cache ---
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [scanningService, setScanningService] = useState<string | null>(null);

  // ✅ Store lastScanMode
  const [showRescanModal, setShowRescanModal] = useState<{
    serviceId: string;
    serviceName: string;
    lastScanMode: string; // "SCAN_ONLY" or "SCAN_AND_BUILD"
  } | null>(null);

  const [rescanTag, setRescanTag] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [editingProject, setEditingProject] = useState<{
    id: string;
    groupName: string;
    repoUrl: string;
  } | null>(null);

  const prevActiveScanIds = useRef<Set<string>>(new Set());

  // --- Data Fetching ---
  const { data: activeScansData } = useSWR(
    status === "authenticated" ? "/api/scan/status/active" : null,
    fetcher,
    { refreshInterval: 2000 },
  );

  const { data: dashboardData, isLoading: dashboardLoading } = useSWR(
    status === "authenticated" ? "/api/dashboard" : null,
    fetcher,
    { 
      // Refresh faster when there are active scans
      refreshInterval: (activeScansData?.activeScans?.length || 0) > 0 ? 3000 : 5000, 
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 1000, // Allow revalidation within 1 second
    },
  );

  const projects: Project[] = dashboardData?.projects || [];
  const activeScans: ActiveScan[] = activeScansData?.activeScans || [];

  // --- Logic: Search Filter ---
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.groupName.toLowerCase().includes(lowerTerm) ||
        p.services.some((s) => s.serviceName.toLowerCase().includes(lowerTerm))
    );
  }, [projects, searchTerm]);

  // --- Logic: Smart Refresh ---
  useEffect(() => {
    if (!activeScansData) return;

    // ✅ FIX: Explicitly cast to Set<string>
    const currentIds = new Set<string>(
      activeScans.map((s: ActiveScan) => s.id),
    );
    const prevIds = prevActiveScanIds.current;

    let hasChanged = false;
    if (currentIds.size !== prevIds.size) hasChanged = true;
    else {
      for (const id of currentIds) {
        if (!prevIds.has(id)) {
          hasChanged = true;
          break;
        }
      }
    }

    if (hasChanged) {
      mutate("/api/dashboard");
    }
    prevActiveScanIds.current = currentIds;
  }, [activeScansData, activeScans]);

  // --- Auth Redirect ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // ✅ Redirect to /setup if not complete (and not admin)
      if (session?.user?.role !== "ADMIN" && !session?.user?.isSetupComplete) {
         router.push("/setup");
      }
    }
  }, [status, router, session]);

  // --- Helpers ---
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Handlers ---
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setDeletingProject(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        // เพิ่ม headers และ body ตรงนี้
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceStop: true }),
      });

      if (res.ok) {
        showToast("Project deleted", "success");
        mutate("/api/dashboard");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error deleting project", "error");
    } finally {
      setDeletingProject(null);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: editingProject.groupName,
          repoUrl: editingProject.repoUrl,
        }),
      });
      if (res.ok) {
        showToast("Project updated", "success");
        setEditingProject(null);
        mutate("/api/dashboard");
      } else {
        showToast("Failed to update", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error updating", "error");
    }
  };

  // ✅ Unified Rescan Handler
  const handleStartRescan = async () => {
    if (!showRescanModal) return;

    setScanningService(showRescanModal.serviceId);
    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: showRescanModal.serviceId,
          scanMode: showRescanModal.lastScanMode,
          imageTag: rescanTag || "latest",
        }),
      });

      // ✅ เพิ่มบรรทัดนี้: อ่านข้อมูล JSON จาก Response
      const data = await res.json();

      if (res.ok) {
        showToast("Scan started", "success");
        setShowRescanModal(null);
        setRescanTag("");
        mutate("/api/scan/status/active");

        // ✅ เพิ่มบรรทัดนี้: สั่ง Redirect ไปหน้าผลลัพธ์ทันที!
        if (data.scanId) {
          router.push(`/scan/${data.scanId}`);
        }
      } else {
        showToast("Failed to start scan", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error starting scan", "error");
    } finally {
      setScanningService(null);
    }
  };

  // --- Loading State ---
  if (status === "loading" || (dashboardLoading && !dashboardData)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse w-full">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden h-80"
          >
            <div className="h-24 bg-slate-200 dark:bg-slate-800"></div>
            <div className="p-5 space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2"></div>
              <div className="h-20 bg-slate-50 dark:bg-slate-800/30 rounded mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900/50 text-red-800 dark:text-red-400"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of your security posture across all projects
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
           {/* Search Projects */}
          <div id="header-search-bar" className="relative w-full sm:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
             </div>
             <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
             />
          </div>

          <Link
            href="/services"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm group"
          >
            <Server size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
            <span>My Services</span>
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block"></div>

          <Tooltip content="Only scan code for secrets/vulns">
            <Link
              href="/scan/scanonly"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
            >
              <Shield
                size={16}
                className="text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
              />
              <span>Scan Only</span>
            </Link>
          </Tooltip>
          <Tooltip content="Full pipeline: Scan code > Build Image > Scan Image">
            <Link
              href="/scan/build"
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            >
              <Package size={16} />
              <span>Scan & Build</span>
            </Link>
          </Tooltip>
        </div>
      </div>

      {/* Content Area */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50/50 dark:ring-slate-800/30">
            <Folder size={40} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No Projects Found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Get started by choosing a scan method below.
          </p>
          
          <div id="tour-create-project-options" className="flex flex-col sm:flex-row gap-4 w-full max-w-lg px-4">
             {/* Scan Only Button */}
             <button
                onClick={() => router.push("/scan/scanonly")}
                className="flex-1 flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:-translate-y-1 transition-all group"
             >
                <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                   <span className="block font-bold text-slate-900 dark:text-white mb-1">Scan Only</span>
                   <span className="text-xs text-slate-500 dark:text-slate-400">Quick security audit code</span>
                </div>
             </button>

             {/* Scan & Build Button */}
             <button
                onClick={() => router.push("/scan/build")}
                className="flex-1 flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group"
             >
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                   <span className="block font-bold text-slate-900 dark:text-white mb-1">Scan & Build</span>
                   <span className="text-xs text-slate-500 dark:text-slate-400">Build with security scan</span>
                </div>
             </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateProjectCard />

          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(p) => setEditingProject(p)}
              onDelete={handleDeleteProject}
              isDeleting={deletingProject === project.id}
              onRescan={(data) => {
                setRescanTag("");
                setShowRescanModal(data);
              }}
            />
          ))}
        </div>
      )}

      {/* ✅ New Smart Rescan Modal */}
      {showRescanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-gray-100 dark:border-slate-800">
            <div
              className={`px-6 py-5 border-b flex items-center gap-3 ${
                showRescanModal.lastScanMode === "SCAN_ONLY"
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30"
                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400"
                    : "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400"
                }`}
              >
                {showRescanModal.lastScanMode === "SCAN_ONLY" ? (
                  <Shield size={20} />
                ) : (
                  <Package size={20} />
                )}
              </div>
              <div>
                <h3
                  className={`font-bold text-lg ${
                    showRescanModal.lastScanMode === "SCAN_ONLY"
                      ? "text-purple-900 dark:text-purple-300"
                      : "text-blue-900 dark:text-blue-300"
                  }`}
                >
                  {showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "Security Audit"
                    : "Scan & Build"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Service:{" "}
                  <span className="font-semibold dark:text-slate-200">
                    {showRescanModal.serviceName}
                  </span>
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  <Tag size={12} />
                  {showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "Version Label"
                    : "Image Tag"}
                </label>
                <input
                  value={rescanTag}
                  onChange={(e) => setRescanTag(e.target.value)}
                  placeholder={
                    showRescanModal.lastScanMode === "SCAN_ONLY"
                      ? "e.g. v1.2-audit"
                      : "e.g. latest, v2.0"
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm text-gray-900 dark:text-white"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "Give this audit a name to easily identify it in comparisons."
                    : "Specify the Docker tag. Defaults to 'latest' if empty."}
                </p>
              </div>

              <button
                onClick={handleStartRescan}
                disabled={!!scanningService}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95 ${
                  showRescanModal.lastScanMode === "SCAN_ONLY"
                    ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                }`}
              >
                {scanningService ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
                {scanningService ? "Starting..." : "Start Scan"}
              </button>

              <button
                onClick={() => setShowRescanModal(null)}
                className="w-full py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Preserved) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 flex justify-between items-center">
              <h3 className="font-bold text-white">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                  Project Name
                </label>
                <input
                  value={editingProject.groupName}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      groupName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">
                  Repo URL
                </label>
                <input
                  value={editingProject.repoUrl}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      repoUrl: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProject}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
