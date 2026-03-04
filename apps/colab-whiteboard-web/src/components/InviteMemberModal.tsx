import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
    onClose: () => void;
}

export default function InviteMemberModal({ whiteboardId, onClose }: Props) {
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState("edit");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [members, setMembers] = useState<MemberData[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const getToken = () => {
        const authTokens = localStorage.getItem("auth_tokens");
        if (!authTokens) return null;
        return JSON.parse(authTokens).accessToken;
    };

    // Fetch existing members
    useEffect(() => {
        const fetchMembers = async () => {
            const token = getToken();
            if (!token) return;

            try {
                const res = await fetch(
                    `${API_URL}/api/collab-whiteboard/${whiteboardId}/members`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data);
                }
            } catch (err) {
                console.error("Failed to fetch members:", err);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, [whiteboardId]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${API_URL}/api/collab-whiteboard/${whiteboardId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
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
        } catch (err) {
            setError("Failed to connect to server");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePermission = async (
        memberId: string,
        newPermission: string
    ) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${API_URL}/api/collab-whiteboard/${whiteboardId}/members/${memberId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ permission: newPermission }),
                }
            );

            if (res.ok) {
                setMembers((prev) =>
                    prev.map((m) =>
                        m.id === memberId ? { ...m, permission: newPermission } : m
                    )
                );
            }
        } catch (err) {
            console.error("Failed to update permission:", err);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${API_URL}/api/collab-whiteboard/${whiteboardId}/members/${memberId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.ok) {
                setMembers((prev) => prev.filter((m) => m.id !== memberId));
            }
        } catch (err) {
            console.error("Failed to remove member:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                Invite Collaborators
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Add people to this whiteboard
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg
                                className="w-5 h-5 text-gray-400"
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
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            required
                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm text-gray-800"
                        />
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                            className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm text-gray-700 bg-white"
                        >
                            <option value="edit">Can Edit</option>
                            <option value="view">Can View</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? "Adding..." : "Add Member"}
                    </button>
                </form>

                {/* Members List */}
                <div className="px-6 pb-5">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                        Members ({members.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {loadingMembers ? (
                            <div className="text-center py-4 text-gray-400 text-sm">
                                Loading members...
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-4 text-gray-400 text-sm">
                                No members yet. Invite someone!
                            </div>
                        ) : (
                            members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                            {member.userEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {member.userName || member.userEmail.split("@")[0]}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                {member.userEmail}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <select
                                            value={member.permission}
                                            onChange={(e) =>
                                                handleUpdatePermission(member.id, e.target.value)
                                            }
                                            className="text-xs px-2 py-1 border border-gray-200 rounded-md bg-white text-gray-600"
                                        >
                                            <option value="edit">Edit</option>
                                            <option value="view">View</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove"
                                        >
                                            <svg
                                                className="w-4 h-4"
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
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
