"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authService.getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    try {
      await authService.refreshToken();
      const newToken = authService.getAccessToken();
      res = await fetch(url, { ...options, headers: { ...headers, ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}) } });
    } catch { /* refresh failed, return original 401 */ }
  }
  return res;
}

interface MemberData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  permission: string;
  createdAt: string;
}

interface Props {
  whiteboardId: string;
  whiteboardTitle: string;
  onClose: () => void;
}

export default function ManageMembersModal({
  whiteboardId,
  whiteboardTitle,
  onClose,
}: Props) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Fetch existing members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/collab-whiteboard/${whiteboardId}/members`);
        if (res.ok) setMembers(await res.json());
      } catch { /* ignore */ }
      finally { setLoadingMembers(false); }
    };
    fetchMembers();
  }, [whiteboardId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await apiFetch(
        `${API_URL}/api/collab-whiteboard/${whiteboardId}/members`,
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase(), permission }),
        }
      );

      if (res.ok) {
        const newMember = await res.json();
        setMembers((prev) => [...prev, newMember]);
        setSuccess(`${email} added as ${permission}!`);
        setEmail("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add member");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (memberId: string, newPermission: string) => {
    try {
      const res = await apiFetch(
        `${API_URL}/api/collab-whiteboard/${whiteboardId}/members/${memberId}`,
        { method: "PUT", body: JSON.stringify({ permission: newPermission }) }
      );
      if (res.ok) setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, permission: newPermission } : m));
    } catch { /* ignore */ }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await apiFetch(
        `${API_URL}/api/collab-whiteboard/${whiteboardId}/members/${memberId}`,
        { method: "DELETE" }
      );
      if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch { /* ignore */ }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md bg-gray-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Manage Members
                </h2>
                <p className="text-sm text-gray-400 mt-0.5 truncate max-w-65">
                  {whiteboardTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Invite Form */}
          <form onSubmit={handleInvite} className="px-6 py-4 space-y-3">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Invite by email..."
                required
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm transition-all"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 outline-none text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="edit" className="bg-gray-800">
                  Can Edit
                </option>
                <option value="view" className="bg-gray-800">
                  Can View
                </option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                "Invite Member"
              )}
            </button>
          </form>

          {/* Members List */}
          <div className="px-6 pb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Members ({members.length})
            </h3>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {loadingMembers ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">
                  No members yet — invite someone!
                </p>
              ) : (
                members.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between py-2.5 px-3 bg-white/5 border border-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {member.userEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {member.userName ||
                            member.userEmail.split("@")[0]}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={member.permission}
                        onChange={(e) =>
                          handleUpdatePermission(member.id, e.target.value)
                        }
                        className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="edit" className="bg-gray-800">
                          Edit
                        </option>
                        <option value="view" className="bg-gray-800">
                          View
                        </option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove member"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
