"use client";
import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle, Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [gitUser, setGitUser] = useState("");
  const [gitToken, setGitToken] = useState("");
  const [hasGitToken, setHasGitToken] = useState(false);

  const [dockerUser, setDockerUser] = useState("");
  const [dockerToken, setDockerToken] = useState("");
  const [hasDockerToken, setHasDockerToken] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/user/settings")
        .then((res) => res.json())
        .then((data) => {
          setGitUser(data.gitUser);
          setHasGitToken(data.hasGitToken);
          setDockerUser(data.dockerUser);
          setHasDockerToken(data.hasDockerToken);
          setLoading(false);
        });
    }
  }, [status, router]);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gitUser, gitToken, dockerUser, dockerToken }),
      });
      showToast("Settings saved successfully");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your integration tokens
          </p>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="p-6 space-y-6">
            {/* GitHub Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                GitHub Token
              </label>
              <div className="space-y-3">
                <input
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Username"
                  value={gitUser}
                  onChange={(e) => setGitUser(e.target.value)}
                />
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder={
                      hasGitToken ? "Token saved" : "Personal Access Token"
                    }
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                  />
                  {hasGitToken && !gitToken && (
                    <CheckCircle
                      className="absolute right-3 top-3 text-green-500"
                      size={18}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Docker Hub Token
              </label>
              <div className="space-y-3">
                <input
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Username"
                  value={dockerUser}
                  onChange={(e) => setDockerUser(e.target.value)}
                />
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder={
                      hasDockerToken ? "Token saved" : "Access Token"
                    }
                    value={dockerToken}
                    onChange={(e) => setDockerToken(e.target.value)}
                  />
                  {hasDockerToken && !dockerToken && (
                    <CheckCircle
                      className="absolute right-3 top-3 text-green-500"
                      size={18}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t p-6 bg-gray-50 rounded-b-xl">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
