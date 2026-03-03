import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";
import {
    Loader2,
    Plus,
    Check,
    Square,
    MessageCircle,
    Bell,
    X,
    Pencil,
} from "lucide-react";
import UserHeader from "../user/components/Header";
import api from "../../utils/api";
import AssigneePicker from "./components/AssigneePicker";
import AddFollowupModal from "./components/AddFollowupModal";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const getAddressDisplay = (c) => {
    if (c?.full_address) return c.full_address;
    const addr = c?.address;
    if (!addr) return "";
    const parts = [addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean);
    return parts.join(", ");
};

const CRMCustomerPage = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [purchaseDetails, setPurchaseDetails] = useState(null);
    const [followups, setFollowups] = useState([]);
    const [followupLogs, setFollowupLogs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [branchUsers, setBranchUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("performance");
    const [taskFilter, setTaskFilter] = useState("All Tasks");
    const [taskSearch, setTaskSearch] = useState("");
    const [followupFilter, setFollowupFilter] = useState("All Time");
    const [followupSearch, setFollowupSearch] = useState("");
    const [purchaseSearch, setPurchaseSearch] = useState("");
    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [newTask, setNewTask] = useState({ title: "", description: "", assignees: [] });
    const [commentTaskId, setCommentTaskId] = useState(null);
    const [newComment, setNewComment] = useState({ text: "", assignees: [] });
    const [viewingTaskId, setViewingTaskId] = useState(null);
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [addFollowupModalOpen, setAddFollowupModalOpen] = useState(false);
    const [viewingFollowupLog, setViewingFollowupLog] = useState(null);
    const [newFollowupComment, setNewFollowupComment] = useState({ text: "", assignees: [] });
    const [replyingToFollowupCommentId, setReplyingToFollowupCommentId] = useState(null);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const [custRes, perfRes, purchRes, followRes, followupLogsRes, taskRes, usersRes] = await Promise.all([
                    api.get(`/customers/${id}`),
                    api.get(`/crm/customers/${id}/performance`).catch(() => ({ data: {} })),
                    api.get(`/crm/customers/${id}/purchase-details`).catch(() => ({ data: {} })),
                    api.get(`/customer-followups?customer_id=${id}&limit=100`).catch(() => ({ data: {} })),
                    api.get(`/crm/followup-logs?customer_id=${id}`).catch(() => ({ data: {} })),
                    api.get(`/crm/tasks?customer_id=${id}`).catch(() => ({ data: {} })),
                    api.get("/crm/branch-users/me").catch(() => ({ data: {} })),
                ]);
                if (custRes.data?.status === "success" && custRes.data?.data?.customer) {
                    setCustomer(custRes.data.data.customer);
                }
                if (usersRes.data?.status === "success" && usersRes.data?.data?.users) {
                    setBranchUsers(usersRes.data.data.users);
                }
                if (perfRes.data?.status === "success" && perfRes.data?.data) {
                    setPerformance(perfRes.data.data);
                }
                if (purchRes.data?.status === "success" && purchRes.data?.data) {
                    setPurchaseDetails(purchRes.data.data);
                }
                if (followRes.data?.status === "success" && followRes.data?.data?.followups) {
                    setFollowups(followRes.data.data.followups);
                }
                if (followupLogsRes.data?.status === "success" && followupLogsRes.data?.data?.logs) {
                    setFollowupLogs(followupLogsRes.data.data.logs);
                }
                if (taskRes.data?.status === "success" && taskRes.data?.data?.tasks) {
                    setTasks(taskRes.data.data.tasks);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const refreshTasks = async () => {
        try {
            const res = await api.get(`/crm/tasks?customer_id=${id}`);
            if (res.data?.status === "success" && res.data?.data?.tasks) {
                setTasks(res.data.data.tasks);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const refreshFollowupLogs = async () => {
        try {
            const res = await api.get(`/crm/followup-logs?customer_id=${id}`);
            if (res.data?.status === "success" && res.data?.data?.logs) {
                setFollowupLogs(res.data.data.logs);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddFollowupComment = async (e) => {
        e.preventDefault();
        if (!viewingFollowupLog?._id || !newFollowupComment.text.trim()) return;
        try {
            const res = await api.post(`/crm/followup-logs/${viewingFollowupLog._id}/comments`, {
                text: newFollowupComment.text.trim(),
                assignees: newFollowupComment.assignees || [],
                ...(replyingToFollowupCommentId ? { parent_id: replyingToFollowupCommentId } : {}),
            });
            if (res.data?.status === "success" && res.data?.data?.log) {
                setViewingFollowupLog(res.data.data.log);
                setNewFollowupComment({ text: "", assignees: [] });
                setReplyingToFollowupCommentId(null);
                refreshFollowupLogs();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim()) return;
        try {
            await api.post("/crm/tasks", {
                customer_id: id,
                title: newTask.title.trim(),
                description: (newTask.description || "").trim(),
                assignees: newTask.assignees || [],
            });
            setNewTask({ title: "", description: "", assignees: [] });
            setAddTaskOpen(false);
            refreshTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditTask = async (e) => {
        e.preventDefault();
        if (!editingTask || !newTask.title.trim()) return;
        try {
            await api.patch(`/crm/tasks/${editingTask._id}`, {
                title: newTask.title.trim(),
                description: (newTask.description || "").trim(),
                assignees: newTask.assignees || [],
            });
            setEditingTask(null);
            setNewTask({ title: "", description: "", assignees: [] });
            refreshTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const openEditTask = (task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title || "",
            description: task.description || "",
            assignees: (task.assignees || []).map((a) => (typeof a === "object" ? a._id : a)).filter(Boolean),
        });
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        try {
            await api.patch(`/crm/tasks/${taskId}`, {
                status: currentStatus === "completed" ? "pending" : "completed",
            });
            refreshTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        const taskId = commentTaskId || viewingTaskId;
        if (!taskId || !newComment.text.trim()) return;
        try {
            await api.post(`/crm/tasks/${taskId}/comments`, {
                text: newComment.text.trim(),
                assignees: newComment.assignees || [],
                ...(replyingToCommentId ? { parent_id: replyingToCommentId } : {}),
            });
            setNewComment({ text: "", assignees: [] });
            setReplyingToCommentId(null);
            refreshTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const commentTask = commentTaskId ? tasks.find((t) => t._id === commentTaskId) : null;
    const commentList = commentTask?.comments || [];
    const viewingTask = viewingTaskId ? tasks.find((t) => t._id === viewingTaskId) : null;

    const formatAssignees = (assignees) =>
        (assignees || [])
            .map((a) => (typeof a === "object" ? a.username || [a.first_name, a.last_name].filter(Boolean).join(" ") : null))
            .filter(Boolean)
            .join(", ") || "—";

    const commentAuthorName = (c) =>
        c?.author ? [c.author.first_name, c.author.last_name].filter(Boolean).join(" ") || c.author.username || "—" : "—";

    const buildCommentTree = (comments) => {
        if (!Array.isArray(comments) || comments.length === 0) return [];
        const list = comments.map((c) => ({ ...c, _id: c._id ? String(c._id) : c._id }));
        const byParent = {};
        list.forEach((c) => {
            const pid = c.parent_id ? String(c.parent_id) : null;
            if (!byParent[pid]) byParent[pid] = [];
            byParent[pid].push(c);
        });
        byParent[null] = byParent[null] || [];
        byParent[""] = byParent[""] || [];
        const roots = [...(byParent[null] || []), ...(byParent[""] || [])].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        const getReplies = (parentId) =>
            (byParent[parentId] || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const nest = (item) => ({
            ...item,
            replies: getReplies(item._id).map(nest),
        });
        return roots.map(nest);
    };

    const renderCommentBlock = (node, depth = 0) => {
        const isReply = depth > 0;
        return (
            <div key={node._id} className={isReply ? "ml-5 mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3" : "mt-3 first:mt-0"}>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{commentAuthorName(node)}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{node.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {node.created_at ? new Date(node.created_at).toLocaleString() : ""}
                        {node.assignees?.length ? ` · ${formatAssignees(node.assignees)}` : ""}
                    </p>
                    <button
                        type="button"
                        onClick={() => setReplyingToCommentId(node._id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                        Reply
                    </button>
                </div>
                {(node.replies || []).map((r) => renderCommentBlock(r, depth + 1))}
            </div>
        );
    };

    const renderFollowupCommentBlock = (node, depth = 0) => {
        const isReply = depth > 0;
        return (
            <div key={node._id} className={isReply ? "ml-5 mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3" : "mt-3 first:mt-0"}>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{commentAuthorName(node)}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{node.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {node.created_at ? new Date(node.created_at).toLocaleString() : ""}
                        {node.assignees?.length ? ` · ${formatAssignees(node.assignees)}` : ""}
                    </p>
                    <button
                        type="button"
                        onClick={() => setReplyingToFollowupCommentId(node._id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                        Reply
                    </button>
                </div>
                {(node.replies || []).map((r) => renderFollowupCommentBlock(r, depth + 1))}
            </div>
        );
    };

    const replyingToComment = (commentTask?.comments || viewingTask?.comments || []).find(
        (c) => c._id && String(c._id) === String(replyingToCommentId)
    );

    const replyingToFollowupComment = (viewingFollowupLog?.comments || []).find(
        (c) => c._id && String(c._id) === String(replyingToFollowupCommentId)
    );

    const filteredTasks = tasks.filter((t) => {
        const matchSearch =
            !taskSearch ||
            (t.title || "").toLowerCase().includes(taskSearch.toLowerCase()) ||
            (t.description || "").toLowerCase().includes(taskSearch.toLowerCase());
        if (!matchSearch) return false;
        if (taskFilter === "Pending") return t.status === "pending";
        if (taskFilter === "Completed") return t.status === "completed";
        return true;
    });

    const now = new Date();
    const filteredFollowups = followups.filter((f) => {
        const matchSearch =
            !followupSearch ||
            (f.subject || "").toLowerCase().includes(followupSearch.toLowerCase()) ||
            (f.description || "").toLowerCase().includes(followupSearch.toLowerCase());
        if (!matchSearch) return false;
        const fd = f.followup_date ? new Date(f.followup_date) : null;
        if (followupFilter === "Today" && fd) {
            return fd.toDateString() === now.toDateString();
        }
        if (followupFilter === "This Week" && fd) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            return fd >= weekStart && fd <= now;
        }
        return true;
    });

    const filteredFollowupLogs = followupLogs.filter((log) => {
        const matchSearch =
            !followupSearch ||
            (log.serial_no || "").toLowerCase().includes(followupSearch.toLowerCase()) ||
            (log.customer_name || "").toLowerCase().includes(followupSearch.toLowerCase()) ||
            (log.purpose || "").toLowerCase().includes(followupSearch.toLowerCase()) ||
            (log.comment || "").toLowerCase().includes(followupSearch.toLowerCase()) ||
            (log.employee_name || "").toLowerCase().includes(followupSearch.toLowerCase());
        if (!matchSearch) return false;
        const ins = log.inserted_time ? new Date(log.inserted_time) : null;
        if (followupFilter === "Today" && ins) return ins.toDateString() === now.toDateString();
        if (followupFilter === "This Week" && ins) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            return ins >= weekStart && ins <= now;
        }
        return true;
    });

    const filteredPurchaseRows = (purchaseDetails?.rows || []).filter((row) => {
        const q = (purchaseSearch || "").toLowerCase().trim();
        if (!q) return true;
        return (
            (row.item_name || "").toLowerCase().includes(q) ||
            (row.group || "").toLowerCase().includes(q) ||
            (row.masterGroup || "").toLowerCase().includes(q)
        );
    });

    const salesExName =
        customer?.sales_ex_display ||
        (customer?.sales_executive && typeof customer.sales_executive === "object"
            ? [customer.sales_executive.first_name, customer.sales_executive.last_name].filter(Boolean).join(" ") || customer.sales_executive.username
            : "");
    const coordName =
        customer?.coordinator_display ||
        (customer?.coordinator && typeof customer.coordinator === "object"
            ? [customer.coordinator.first_name, customer.coordinator.last_name].filter(Boolean).join(" ") || customer.coordinator.username
            : "");

    const pieData = performance?.salesChart?.length
        ? [
              { name: "Sales", value: performance.salesChart.reduce((s, d) => s + (d.value || 0), 0) },
          ]
        : [{ name: "No data", value: 1 }];

    if (loading && !customer) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <UserHeader />
                <main className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </main>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <UserHeader />
                <main className="max-w-7xl mx-auto px-4 py-8">
                    <p className="text-gray-600 dark:text-gray-400">Customer not found.</p>
                    <Link to="/crm" className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block">
                        Back to CRM
                    </Link>
                </main>
            </div>
        );
    }

    const lastUpdated = performance?.lastUpdated
        ? new Date(performance.lastUpdated).toLocaleDateString()
        : "—";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <UserHeader />
            <main className="mx-auto px-4 ">
                <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <Link to="/crm" className="hover:text-blue-600 dark:hover:text-blue-400">
                        CRM
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white">{customer.name}</span>
                </nav>

                <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {customer.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {getAddressDisplay(customer) || "—"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                            {customer.location || "—"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Sales Ex.: {salesExName || "—"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Co-ordinator: {coordName || "—"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    {["performance", "purchase", "followup"].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                tab === t
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                            }`}
                        >
                            {t === "performance" && "Customer Performance Analysis"}
                            {t === "purchase" && "Purchase Details"}
                            {t === "followup" && "Follow-up Summary"}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Statement of Accounts</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Last Updated on {lastUpdated}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ledger Statement</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Last Updated on {lastUpdated}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Customer Purchase Details</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Last Updated on {purchaseDetails?.lastUpdated ? new Date(purchaseDetails.lastUpdated).toLocaleDateString() : lastUpdated}</p>
                    </div>
                </div>

                {tab === "performance" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-800 rounded-lg p-4 text-white">
                                <p className="text-xs opacity-80">Last Payment</p>
                                <p className="font-semibold">{performance?.summary?.last_payment_date ? new Date(performance.summary.last_payment_date).toLocaleDateString() : "—"}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 text-white">
                                <p className="text-xs opacity-80">Received on</p>
                                <p className="font-semibold">{performance?.summary?.last_payment_date ? new Date(performance.summary.last_payment_date).toLocaleDateString() : "—"}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 text-white">
                                <p className="text-xs opacity-80">Payment pending from</p>
                                <p className="font-semibold">{performance?.summary?.closing_balance != null ? Number(performance.summary.closing_balance) : "—"}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 text-white">
                                <p className="text-xs opacity-80">Avg. days for Payment</p>
                                <p className="font-semibold">—</p>
                            </div>
                        </div>
                        {performance?.yearCards?.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {performance.yearCards.map((y) => (
                                    <div key={y.year} className="bg-gray-800 rounded-lg p-4 text-white">
                                        <p className="text-sm font-medium">Year {y.year}</p>
                                        <p className="text-lg font-semibold">Sales: {y.sales != null ? y.sales.toLocaleString() : "—"}</p>
                                        <p className="text-sm opacity-90">Receipts: {y.receipts != null ? y.receipts.toLocaleString() : "—"}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-800 rounded-lg p-4 text-white">
                                <p className="text-sm font-medium mb-2">Balance over time</p>
                                <div className="h-[300px]">
                                    {performance?.balanceChart?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={performance.balanceChart}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                                <XAxis dataKey="date" stroke="#fff" fontSize={12} />
                                                <YAxis stroke="#fff" fontSize={12} />
                                                <Tooltip contentStyle={{ background: "#1f2937", border: "none" }} />
                                                <Line type="monotone" dataKey="balance" stroke="#60a5fa" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-gray-400 text-sm">No balance data</p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 text-white">
                                <p className="text-sm font-medium mb-2">Sales over time</p>
                                <div className="h-[300px]">
                                    {performance?.salesChart?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performance.salesChart}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                                                <XAxis dataKey="label" stroke="#fff" fontSize={12} />
                                                <YAxis stroke="#fff" fontSize={12} />
                                                <Tooltip contentStyle={{ background: "#1f2937", border: "none" }} />
                                                <Bar dataKey="value" fill="#34d399" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <p className="text-gray-400 text-sm">No sales data</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {["All products", "Paints", "Auxiliaries", "Accessories"].map((label, i) => (
                                <div key={label} className="bg-gray-800 rounded-lg p-4 text-white">
                                    <p className="text-sm font-medium mb-2">{label}</p>
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    label={() => label}
                                                >
                                                    {pieData.map((_, index) => (
                                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#1f2937", border: "none" }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === "purchase" && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <input
                                type="text"
                                placeholder="Search by item or group..."
                                value={purchaseSearch}
                                onChange={(e) => setPurchaseSearch(e.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm w-full max-w-xs"
                            />
                        </div>
                        {filteredPurchaseRows.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Master Group</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Group</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                                        {(purchaseDetails.monthKeys || []).slice(-12).map((m) => (
                                            <th key={m} className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{m.slice(5)}</th>
                                        ))}
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Year 1</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Year 2</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Graph</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredPurchaseRows.map((row, idx) => (
                                        <tr key={idx} className="bg-white dark:bg-gray-800">
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{row.masterGroup}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{row.group}</td>
                                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{row.item_name}</td>
                                            {(row.months || []).slice(-12).map((mo, i) => (
                                                <td key={i} className="px-2 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{mo.value ? mo.value.toLocaleString() : "—"}</td>
                                            ))}
                                            <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">{row.total != null ? row.total.toLocaleString() : "—"}</td>
                                            <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{row.year1 != null ? row.year1.toLocaleString() : "—"}</td>
                                            <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{row.year2 != null ? row.year2.toLocaleString() : "—"}</td>
                                            <td className="px-4 py-2 text-right">
                                                {(row.months || []).length > 0 ? (
                                                    <div className="w-16 h-8 inline-block">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={(row.months || []).map((m) => ({ name: m.month?.slice(5) || "", value: m.value || 0 }))}>
                                                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={1} />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No purchase details yet. Upload ledger data from the CRM dashboard to see purchase history.
                            </p>
                        )}
                    </div>
                )}

                {tab === "followup" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Manager</h2>
                                <button
                                    type="button"
                                    onClick={() => setAddTaskOpen(true)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" /> Add Task
                                </button>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={taskSearch}
                                    onChange={(e) => setTaskSearch(e.target.value)}
                                    className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                />
                                <select
                                    value={taskFilter}
                                    onChange={(e) => setTaskFilter(e.target.value)}
                                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                >
                                    <option value="All Tasks">All Tasks</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {filteredTasks.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No tasks.</p>
                                ) : (
                                    filteredTasks.map((t) => {
                                        const commentCount = t.comments?.length || 0;
                                        return (
                                        <div
                                            key={t._id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setViewingTaskId(t._id)}
                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewingTaskId(t._id); } }}
                                            className={`p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors ${
                                                t.status === "completed" ? "opacity-70" : ""
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-gray-900 dark:text-white ${t.status === "completed" ? "line-through" : ""}`}>{t.title}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{t.description || "—"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                                                        {t.assignees?.length ? ` · Assigned to: ${formatAssignees(t.assignees)}` : ""}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                                        {commentCount === 0 ? "No comments" : `${commentCount} comment${commentCount !== 1 ? "s" : ""}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {t.status !== "completed" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openEditTask(t); }}
                                                            className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                                                            aria-label="Edit task"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setCommentTaskId(t._id); }}
                                                        className={`p-1 rounded ${commentCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"}`}
                                                        aria-label="Comment"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" className="p-1 text-gray-500 hover:text-blue-600" aria-label="Notify"><Bell className="w-4 h-4" /></button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleTaskStatus(t._id, t.status); }}
                                                        className={`inline-flex items-center justify-center w-5 h-5 shrink-0 rounded border-2 transition-colors ${
                                                            t.status === "completed"
                                                                ? "border-green-600 bg-green-600 text-white hover:bg-green-700 hover:border-green-700"
                                                                : "border-gray-400 dark:border-gray-500 hover:border-green-500 dark:hover:border-green-500"
                                                        }`}
                                                        aria-label={t.status === "completed" ? "Mark pending" : "Mark completed"}
                                                    >
                                                        {t.status === "completed" && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Follow-up Summary</h2>
                                <button
                                    type="button"
                                    onClick={() => setAddFollowupModalOpen(true)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" /> Add follow-up
                                </button>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search follow-ups..."
                                    value={followupSearch}
                                    onChange={(e) => setFollowupSearch(e.target.value)}
                                    className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                />
                                <select
                                    value={followupFilter}
                                    onChange={(e) => setFollowupFilter(e.target.value)}
                                    className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 text-sm"
                                >
                                    <option value="All Time">All Time</option>
                                    <option value="Today">Today</option>
                                    <option value="This Week">This Week</option>
                                </select>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {filteredFollowupLogs.length === 0 && filteredFollowups.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No follow-ups.</p>
                                ) : (
                                    <>
                                        {filteredFollowupLogs.map((log) => (
                                            <div
                                                key={log._id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setViewingFollowupLog(log)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewingFollowupLog(log); } }}
                                                className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{log.serial_no || "—"}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                                                {log.purpose || "—"}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                                                {log.connection_type || "—"}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {log.inserted_time ? new Date(log.inserted_time).toLocaleString() : "—"}
                                                            {log.employee_name ? ` · ${log.employee_name}` : ""}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {(log.comments?.length || 0) === 0 ? "No comments" : `${log.comments.length} comment${log.comments.length !== 1 ? "s" : ""}`}
                                                        </p>
                                                        {(log.comment || "").trim() && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{log.comment}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredFollowups.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Scheduled follow-ups</p>
                                                {filteredFollowups.map((f) => (
                                                    <div key={f._id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-600 mb-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {f.created_by?.username || f.assigned_to?.username || "—"}
                                                            </span>
                                                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                                                {f.followup_type || "—"}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                                                {f.followup_date ? new Date(f.followup_date).toLocaleString() : ""}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{f.subject || "—"}</p>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{f.description || "—"}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {addTaskOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setAddTaskOpen(false)} aria-hidden="true" />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Task</h3>
                            <button type="button" onClick={() => setAddTaskOpen(false)} className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                />
                            </div>
                            <AssigneePicker
                                users={branchUsers}
                                value={newTask.assignees}
                                onChange={(assignees) => setNewTask((prev) => ({ ...prev, assignees }))}
                                placeholder="Search and select users to assign..."
                                label="Assignees"
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setAddTaskOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => { setEditingTask(null); setNewTask({ title: "", description: "", assignees: [] }); }} aria-hidden="true" />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h3>
                            <button type="button" onClick={() => { setEditingTask(null); setNewTask({ title: "", description: "", assignees: [] }); }} className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleEditTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                />
                            </div>
                            <AssigneePicker
                                users={branchUsers}
                                value={newTask.assignees}
                                onChange={(assignees) => setNewTask((prev) => ({ ...prev, assignees }))}
                                placeholder="Search and select users to assign..."
                                label="Assignees"
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => { setEditingTask(null); setNewTask({ title: "", description: "", assignees: [] }); }} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Update Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingTaskId && viewingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => { setViewingTaskId(null); setReplyingToCommentId(null); }}
                        aria-hidden="true"
                    />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
                                {viewingTask.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setViewingTaskId(null); setReplyingToCommentId(null); }}
                                className="absolute top-4 right-4 p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                                <p className="text-gray-900 dark:text-white mt-0.5">{viewingTask.description || "—"}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                    {viewingTask.status === "completed" ? "Completed" : "Pending"}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    Created {viewingTask.created_at ? new Date(viewingTask.created_at).toLocaleDateString() : "—"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned to</p>
                                <p className="text-gray-900 dark:text-white mt-0.5">{formatAssignees(viewingTask.assignees)}</p>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comments {(viewingTask.comments?.length || 0) > 0 && `(${viewingTask.comments.length})`}
                                </p>
                                {buildCommentTree(viewingTask.comments || []).length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
                                ) : (
                                    <div className="space-y-0">
                                        {buildCommentTree(viewingTask.comments || []).map((root) => renderCommentBlock(root))}
                                    </div>
                                )}
                                <form onSubmit={handleAddComment} className="mt-4 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    {replyingToCommentId && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            Replying to {commentAuthorName(replyingToComment)}
                                            <button
                                                type="button"
                                                onClick={() => setReplyingToCommentId(null)}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </p>
                                    )}
                                    <textarea
                                        value={newComment.text}
                                        onChange={(e) => setNewComment((prev) => ({ ...prev, text: e.target.value }))}
                                        rows={2}
                                        placeholder="Add a comment..."
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                        required
                                    />
                                    <AssigneePicker
                                        users={branchUsers}
                                        value={newComment.assignees}
                                        onChange={(assignees) => setNewComment((prev) => ({ ...prev, assignees }))}
                                        placeholder="Mention users..."
                                        label=""
                                    />
                                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                                        Post
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2">
                            {viewingTask.status !== "completed" && (
                                <button
                                    type="button"
                                    onClick={() => { openEditTask(viewingTask); setViewingTaskId(null); }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                >
                                    <Pencil className="w-4 h-4" /> Edit
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => { setCommentTaskId(viewingTask._id); setViewingTaskId(null); }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                            >
                                <MessageCircle className="w-4 h-4" /> Comment
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                aria-label="Notify"
                            >
                                <Bell className="w-4 h-4" /> Notify
                            </button>
                            <button
                                type="button"
                                onClick={() => { toggleTaskStatus(viewingTask._id, viewingTask.status); setViewingTaskId(null); }}
                                className={`inline-flex items-center justify-center gap-2 w-8 h-8 shrink-0 rounded border-2 text-sm ${
                                    viewingTask.status === "completed"
                                        ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600"
                                        : "border-gray-400 dark:border-gray-500 hover:border-green-500 dark:hover:border-green-500"
                                }`}
                                aria-label={viewingTask.status === "completed" ? "Mark pending" : "Mark completed"}
                            >
                                {viewingTask.status === "completed" ? (
                                    <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">✓</span>
                                )}
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {viewingTask.status === "completed" ? "Mark Pending" : "Mark Complete"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {commentTaskId && commentTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => { setCommentTaskId(null); setNewComment({ text: "", assignees: [] }); setReplyingToCommentId(null); }}
                        aria-hidden="true"
                    />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Comments · {commentTask.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setCommentTaskId(null); setNewComment({ text: "", assignees: [] }); setReplyingToCommentId(null); }}
                                className="p-1 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {buildCommentTree(commentList).length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
                            ) : (
                                <div className="space-y-0">
                                    {buildCommentTree(commentList).map((root) => renderCommentBlock(root))}
                                </div>
                            )}
                            <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {replyingToCommentId && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        Replying to {commentAuthorName(replyingToComment)}
                                        <button
                                            type="button"
                                            onClick={() => setReplyingToCommentId(null)}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </p>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add comment *</label>
                                    <textarea
                                        value={newComment.text}
                                        onChange={(e) => setNewComment((prev) => ({ ...prev, text: e.target.value }))}
                                        rows={3}
                                        placeholder="Write a comment..."
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                                <AssigneePicker
                                    users={branchUsers}
                                    value={newComment.assignees}
                                    onChange={(assignees) => setNewComment((prev) => ({ ...prev, assignees }))}
                                    placeholder="Assign users to this comment..."
                                    label="Assignees"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setCommentTaskId(null); setNewComment({ text: "", assignees: [] }); setReplyingToCommentId(null); }}
                                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                                        Post comment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <AddFollowupModal
                isOpen={addFollowupModalOpen}
                onClose={() => setAddFollowupModalOpen(false)}
                onSuccess={() => {
                    refreshFollowupLogs();
                    setAddFollowupModalOpen(false);
                }}
                prefilledCustomerId={customer?._id}
                prefilledCustomerName={customer?.name || ""}
            />

            {viewingFollowupLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 dark:bg-black/70"
                        onClick={() => { setViewingFollowupLog(null); setNewFollowupComment({ text: "", assignees: [] }); setReplyingToFollowupCommentId(null); }}
                        aria-hidden="true"
                    />
                    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Follow-up details
                            </h2>
                            <button
                                type="button"
                                onClick={() => { setViewingFollowupLog(null); setNewFollowupComment({ text: "", assignees: [] }); setReplyingToFollowupCommentId(null); }}
                                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-gray-500 dark:text-gray-400">Serial No.</p>
                                <p className="font-medium text-gray-900 dark:text-white">{viewingFollowupLog.serial_no || "—"}</p>
                                <p className="text-gray-500 dark:text-gray-400">Inserted at</p>
                                <p className="text-gray-900 dark:text-white">{viewingFollowupLog.inserted_time ? new Date(viewingFollowupLog.inserted_time).toLocaleString() : "—"}</p>
                                <p className="text-gray-500 dark:text-gray-400">Customer</p>
                                <p className="text-gray-900 dark:text-white">{viewingFollowupLog.customer_name || "—"}</p>
                                <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                                <p className="text-gray-900 dark:text-white">{viewingFollowupLog.purpose || "—"}</p>
                                <p className="text-gray-500 dark:text-gray-400">Connection type</p>
                                <p className="text-gray-900 dark:text-white">{viewingFollowupLog.connection_type || "—"}</p>
                                <p className="text-gray-500 dark:text-gray-400">Contact person</p>
                                <p className="text-gray-900 dark:text-white">{viewingFollowupLog.contact_person || "—"}</p>
                                <p className="text-gray-500 dark:text-gray-400">Employee</p>
                                <p className="text-gray-900 dark:text-white">{viewingFollowupLog.employee_name || "—"}</p>
                                {viewingFollowupLog.designation && (
                                    <>
                                        <p className="text-gray-500 dark:text-gray-400">Designation</p>
                                        <p className="text-gray-900 dark:text-white">{viewingFollowupLog.designation}</p>
                                    </>
                                )}
                            </div>
                            {(viewingFollowupLog.comment || "").trim() && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Comment</p>
                                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{viewingFollowupLog.comment}</p>
                                </div>
                            )}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comments {(viewingFollowupLog.comments?.length || 0) > 0 && `(${viewingFollowupLog.comments.length})`}
                                </p>
                                {buildCommentTree(viewingFollowupLog.comments || []).length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
                                ) : (
                                    <div className="space-y-0 mb-4">
                                        {buildCommentTree(viewingFollowupLog.comments || []).map((root) => renderFollowupCommentBlock(root))}
                                    </div>
                                )}
                                <form onSubmit={handleAddFollowupComment} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add comment</label>
                                    {replyingToFollowupCommentId && replyingToFollowupComment && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            Replying to {commentAuthorName(replyingToFollowupComment)}
                                            <button
                                                type="button"
                                                onClick={() => setReplyingToFollowupCommentId(null)}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Cancel
                                            </button>
                                        </p>
                                    )}
                                    <textarea
                                        value={newFollowupComment.text}
                                        onChange={(e) => setNewFollowupComment((prev) => ({ ...prev, text: e.target.value }))}
                                        rows={2}
                                        placeholder="Write a comment..."
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                                        required
                                    />
                                    <AssigneePicker
                                        users={branchUsers}
                                        value={newFollowupComment.assignees}
                                        onChange={(assignees) => setNewFollowupComment((prev) => ({ ...prev, assignees }))}
                                        placeholder="Mention users..."
                                        label=""
                                    />
                                    <button type="submit" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                                        Post comment
                                    </button>
                                </form>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setViewingFollowupLog(null); setNewFollowupComment({ text: "", assignees: [] }); setReplyingToFollowupCommentId(null); }}
                                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMCustomerPage;
