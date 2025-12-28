"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Trash2, AlertTriangle, X, Loader2, Tag, Box, Lock, Unlock, 
  FileText, Code2, LayoutTemplate, Save, Check, FolderTree, 
  ArrowRightCircle, GitBranch
} from "lucide-react";

type Props = {
  buildMode: boolean;
};

type ProjectItem = {
  id: number;
  name: string;
  webUrl: string;
  createdAt: string;
};

function ScanFormContent({ buildMode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildDirInputRef = useRef<HTMLInputElement>(null);

  // 1. Get values from URL
  const paramRepo = searchParams.get("repo") || "";
  const paramContext = searchParams.get("context") || "";
  
  const isContinuityMode = !!paramRepo;

  // 2. Main State
  const [repoUrl, setRepoUrl] = useState(paramRepo);
  const [buildContext, setBuildContext] = useState(paramContext); 
  
  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  
  const [useCustomDockerfile, setUseCustomDockerfile] = useState(false);
  const [customDockerfileContent, setCustomDockerfileContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [gitUser, setGitUser] = useState("");
  const [gitToken, setGitToken] = useState("");

  const [projectName, setProjectName] = useState(""); 
  const [imageTag, setImageTag] = useState("latest");
  const [loading, setLoading] = useState(false);
  
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitProjects, setLimitProjects] = useState<ProjectItem[]>([]);
  const [limitMessage, setLimitMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // FIX: Force update state when URL params change
  useEffect(() => {
    if (paramRepo) {
      setRepoUrl(paramRepo);
    }
    if (paramContext) {
      setBuildContext(paramContext);
    }
  }, [paramRepo, paramContext]);

  // Auto-focus logic for Monorepo Workflow
  useEffect(() => {
    if (isContinuityMode && buildDirInputRef.current) {
        setTimeout(() => buildDirInputRef.current?.focus(), 100);
    }
  }, [isContinuityMode]);

  // Auto-detect Project Name
  useEffect(() => {
    if (!repoUrl) { setProjectName(""); return; }
    try {
      const parts = repoUrl.trim().split("/");
      let name = parts[parts.length - 1];
      if (name.endsWith(".git")) { name = name.replace(".git", ""); }
      
      if (buildContext && buildContext !== ".") {
         const cleanContext = buildContext.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');
         name += `-${cleanContext}`;
      }
      setProjectName(name || "scanned-project");
    } catch (e) { setProjectName("scanned-project"); }
  }, [repoUrl, buildContext]);

  const extractOwnerFromUrl = (url: string): string => {
    try {
        const cleanUrl = url.trim().replace(/\.git$/, "");
        const parts = cleanUrl.split(/[\/:]/);
        if (parts.length >= 2) return parts[parts.length - 2]; 
        return "Anonymous";
    } catch (e) { return "Anonymous"; }
  };

  const handleTemplateChange = async (stack: string) => {
    setSelectedTemplate(stack);
    if (!stack) return;

    setLoadingTemplate(true);
    try {
        const res = await fetch(`/api/templates?stack=${stack}`);
        const content = await res.text();
        setCustomDockerfileContent(content);
        setUseCustomDockerfile(true);
    } catch (err) {
        alert("Failed to load template");
    } finally {
        setLoadingTemplate(false);
    }
  };

  const handleReset = () => {
    router.push("/");
    setRepoUrl("");
    setBuildContext("");
    setProjectName("");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanRepo = repoUrl.trim();
    const detectedUser = extractOwnerFromUrl(cleanRepo); 
    const cleanTag = imageTag.trim() || "latest";

    if (isPrivateRepo && (!gitUser || !gitToken)) return alert("Git Creds required");
    if (buildMode && (!dockerUser || !dockerToken)) return alert("Docker Creds required");

    setLoading(true);

    const payload: any = {
      userName: detectedUser,
      repoUrl: cleanRepo,
      contextPath: buildContext.trim() || ".", 
      buildAfterScan: buildMode,
      projectName: projectName,
      imageTag: cleanTag,
      gitUser: isPrivateRepo ? gitUser : undefined,
      gitToken: isPrivateRepo ? gitToken : undefined,
      customDockerfile: useCustomDockerfile ? customDockerfileContent : undefined
    };

    if (buildMode) {
      payload.dockerUsername = dockerUser;
      payload.dockerAccessToken = dockerToken;
    }

    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      setLoading(false);

      if (res.ok && j.scanId) {
        router.push(`/scan/${j.scanId}`);
      } else if (res.status === 403) {
        setLimitMessage(j.message);
        setLimitProjects(j.projects || []);
        setShowLimitModal(true);
      } else {
        alert("Failed: " + (j.message || j.error));
      }
    } catch (err) {
      setLoading(false);
      alert("Network error.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Confirm?")) return;
    setDeletingId(id);
    try {
        const res = await fetch(`/api/scan/${id}`, { method: "DELETE" });
        if(res.ok) setLimitProjects(prev => prev.filter(p => p.id !== id));
    } finally { setDeletingId(null); }
  }

  return (
    <>
      <div className="flex justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-xl p-6 space-y-6 bg-white rounded-xl border border-slate-200 shadow-sm mt-6 relative z-10">
        
        {/* Context Awareness Banner */}
        {isContinuityMode && (
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start justify-between gap-3 animate-in slide-in-from-top-2">
               <div className="flex items-start gap-3">
                   <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <GitBranch size={18} />
                   </div>
                   <div>
                       <h4 className="text-sm font-bold text-indigo-900">Multi-Service Build Mode</h4>
                       <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                           You are setting up another service for the repository. <br/>
                           Please specify the <b>Build Directory</b> below (e.g., <code>frontend</code>).
                       </p>
                   </div>
               </div>
               <button 
                  type="button" 
                  onClick={handleReset}
                  className="text-xs text-slate-500 underline hover:text-slate-800 whitespace-nowrap"
               >
                  Clear / Start New
               </button>
           </div>
        )}

        <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {buildMode ? "Scan & Build Configuration" : "Security Scan Configuration"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Configure your repository and build settings.</p>
        </div>

        {/* 1. Repo URL */}
        <div>
          <label className="block mb-1.5 font-semibold text-slate-700 text-sm">Git Repository URL</label>
          <div className="relative">
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                required
                className={`w-full border px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${isContinuityMode ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-white'}`}
              />
              {isContinuityMode && (
                  <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
                      <Lock size={16} />
                  </div>
              )}
          </div>
        </div>

        {/* 1.5 Build Directory */}
        <div className={`p-4 rounded-lg border transition-all duration-300 ${isContinuityMode ? 'bg-white border-indigo-300 ring-4 ring-indigo-50 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
            <label className={`block mb-1.5 font-semibold text-sm flex items-center gap-2 ${isContinuityMode ? 'text-indigo-700' : 'text-slate-700'}`}>
                <FolderTree size={16} /> Build Directory (Optional)
            </label>
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 select-none">/root/</span>
                <input
                    ref={buildDirInputRef}
                    type="text"
                    value={buildContext}
                    onChange={(e) => setBuildContext(e.target.value)}
                    placeholder="e.g. backend or frontend"
                    className="flex-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition bg-white"
                />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
                Use this to point to a specific folder in a monorepo structure.
            </p>
        </div>

        {/* 2. Private Repo Credentials */}
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
                <input 
                    type="checkbox" id="isPrivate"
                    checked={isPrivateRepo}
                    onChange={(e) => setIsPrivateRepo(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-slate-700 cursor-pointer select-none flex items-center gap-1">
                    Private Repository? {isPrivateRepo ? <Lock size={14} className="text-amber-600"/> : <Unlock size={14} className="text-slate-400"/>}
                </label>
            </div>
            {isPrivateRepo && (
            <div className="space-y-3 mt-3 pl-6 border-l-2 border-slate-200 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" value={gitUser} onChange={(e) => setGitUser(e.target.value)} placeholder="Git Username" className="w-full border p-2 rounded text-sm outline-none" />
                    <input type="password" value={gitToken} onChange={(e) => setGitToken(e.target.value)} placeholder="Git PAT (Not saved)" className="w-full border p-2 rounded text-sm outline-none" />
                </div>
                <p className="text-[10px] text-amber-600">* For security, please re-enter credentials for each new service scan.</p>
            </div>
            )}
        </div>

        {/* 3. Dockerfile Editor Trigger */}
        <div className="border rounded-lg p-4 bg-white border-slate-200 shadow-sm transition-all hover:border-blue-300 group">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <FileText size={18} className="text-blue-600"/>
                        <span className="font-semibold text-slate-700 text-sm">Dockerfile Configuration</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        {useCustomDockerfile 
                            ? <span className="text-green-600 font-medium flex items-center gap-1"><Check size={12}/> Custom Config Active</span> 
                            : "Using default auto-detection"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsEditorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
                >
                    <Code2 size={16} />
                    {useCustomDockerfile ? "Edit Code" : "Customize"}
                </button>
            </div>
        </div>

        {/* 4. Build Settings */}
        {buildMode && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                <p className="font-semibold uppercase tracking-wide mb-1 opacity-70">Target Image Preview</p>
                <p className="font-mono break-all">
                   index.docker.io/{dockerUser || "<user>"}/{projectName || "<project>"}:{imageTag || "latest"}
                </p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={dockerUser} onChange={(e) => setDockerUser(e.target.value)} placeholder="Docker User" className="w-full border p-2 rounded text-sm outline-none" />
                <input value={dockerToken} onChange={(e) => setDockerToken(e.target.value)} placeholder="Docker Token" type="password" className="w-full border p-2 rounded text-sm outline-none" />
             </div>
             <div className="flex items-center gap-2">
                <input value={imageTag} onChange={(e) => setImageTag(e.target.value)} placeholder="latest" className="flex-1 border p-2 rounded text-sm outline-none" />
             </div>
          </div>
        )}

        <div className="pt-4">
          <button disabled={loading} className="w-full bg-slate-900 text-white px-6 py-3.5 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-70 flex justify-center items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin" /> : (isContinuityMode ? "Scan Next Service" : "Start Security Scan")}
          </button>
        </div>
      </form>
      </div>

      {/* Slide-over Editor */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity" onClick={() => setIsEditorOpen(false)} />
      )}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[800px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isEditorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Code2 className="text-blue-600"/> Dockerfile Editor</h3>
                    <p className="text-xs text-slate-500">{buildContext ? `Editing for directory: /${buildContext}` : "Editing for Root directory"}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-300 shadow-sm">
                        <LayoutTemplate size={14} className="text-slate-500"/>
                        <select 
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="text-sm bg-transparent outline-none cursor-pointer text-slate-700 font-medium"
                            disabled={loadingTemplate}
                        >
                            <option value="">-- Load Template --</option>
                            <option value="node">Node.js</option>
                            <option value="python">Python</option>
                            <option value="java">Java (Maven)</option>
                            <option value="go">Go</option>
                            <option value="default">Generic (Alpine)</option>
                        </select>
                    </div>
                    <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"><X size={20} /></button>
                </div>
            </div>
            <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden flex flex-col">
                {loadingTemplate && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-white w-8 h-8"/></div>}
                <div className="px-4 py-2 bg-[#2d2d2d] border-b border-[#444] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <input type="checkbox" id="enableCustom" checked={useCustomDockerfile} onChange={(e) => setUseCustomDockerfile(e.target.checked)} className="accent-blue-500 w-4 h-4 cursor-pointer"/>
                         <label htmlFor="enableCustom" className="text-xs text-gray-300 cursor-pointer select-none">Enable Custom Dockerfile</label>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">Dockerfile</span>
                </div>
                <textarea
                    value={customDockerfileContent}
                    onChange={(e) => { setCustomDockerfileContent(e.target.value); if (!useCustomDockerfile) setUseCustomDockerfile(true); }}
                    placeholder="# Load a template or paste your Dockerfile here..."
                    className="flex-1 w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none resize-none leading-relaxed"
                    spellCheck={false}
                />
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                 <div className="text-xs text-amber-600 flex items-center gap-1">{useCustomDockerfile && <><AlertTriangle size={12}/> Overrides default build.</>}</div>
                 <button onClick={() => setIsEditorOpen(false)} className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition shadow-lg"><Save size={16} /> Save & Close</button>
            </div>
        </div>
      </div>

      {showLimitModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Limit Reached</h3>
                <p className="text-sm text-slate-600 mb-4">{limitMessage}</p>
                <div className="max-h-60 overflow-y-auto mb-4 border rounded">
                    {limitProjects.map((p) => (
                        <div key={p.id} className="flex justify-between p-3 border-b hover:bg-slate-50 text-sm">
                            <span className="truncate">{p.name}</span>
                            <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Delete</button>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end"><button onClick={() => setShowLimitModal(false)} className="px-4 py-2 border rounded text-sm">Close</button></div>
            </div>
         </div>
      )}
    </>
  );
}

export default function ScanForm(props: Props) {
    return (
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-slate-400">Loading Configuration...</div>}>
            <ScanFormContent {...props} />
        </Suspense>
    );
}