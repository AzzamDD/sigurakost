import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import {
    Home,
    Package,
    Tags,
    Warehouse as WarehouseIcon,
    Store,
    ShieldCheck,
    Users,
    Settings,
    Search,
    ChevronRight,
    ChevronLeft,
    Plus,
    Pencil,
    Trash2,
    User,
    CheckCircle2,
    Shield,
} from "lucide-react";

const API_URL =import.meta.env.VITE_API_URL + "/api" || "http://localhost:8000/api";

/* ---------- Types — cuma id & nama, sesuai tabel asli ---------- */
type RoleItem = {
    id: number;
    nama: string;
    total_users?: number;
};

type RoleForm = {
    nama: string;
};

type ViewMode = "list" | "add" | "edit";

const emptyRoleForm: RoleForm = { nama: "" };

export default function RolePage() {
    const navigate = useNavigate();
    const { user } = useUser();

    const [view, setView] = useState<ViewMode>("list");
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [formData, setFormData] = useState<RoleForm>(emptyRoleForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const menuItems = [
        { label: "Beranda", icon: Home, path: "/dashboard", active: false },
        { label: "Produk", icon: Package, path: "/produk", active: false },
        { label: "Kategori", icon: Tags, path: "/kategori", active: false },
        { label: "Warehouse", icon: WarehouseIcon, path: "/warehouse", active: false },
        { label: "Merchant", icon: Store, path: "/merchant", active: false },
    ];

    const accountItems = [
        { label: "Roles", icon: ShieldCheck, path: "/role", active: true },
        { label: "Manajemen User", icon: Users, path: "/manageUser", active: false },
        { label: "Settings", icon: Settings, path: "/settings", active: false },
    ];

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return { Authorization: `Bearer ${token}`, Accept: "application/json" };
    };

    /* ---------- Fetch ---------- */
    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const res = await fetch(`${API_URL}/role`, { headers: authHeaders() });
            if (!res.ok) {
                console.error("[fetchRoles] status:", res.status);
                return;
            }
            setRoles(await res.json());
        } catch (e) {
            console.error("[fetchRoles] network error:", e);
        } finally {
            setLoadingRoles(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const filteredRoles = roles.filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return r.nama.toLowerCase().includes(q);
    });

    /* ---------- Form ---------- */
    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openAddForm = () => {
        setFormData(emptyRoleForm);
        setEditingId(null);
        setView("add");
    };

    const openEditForm = (role: RoleItem) => {
        setFormData({ nama: role.nama });
        setEditingId(role.id);
        setView("edit");
    };

    const cancelForm = () => {
        setFormData(emptyRoleForm);
        setEditingId(null);
        setView("list");
    };

    const submitRole = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const isEdit = editingId !== null;
            const url = isEdit ? `${API_URL}/role/${editingId}` : `${API_URL}/role`;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ nama: formData.nama }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    alert(Array.isArray(firstError) ? firstError[0] : "Data tidak valid");
                } else {
                    alert(data.message || "Gagal menyimpan role");
                }
                return;
            }

            await fetchRoles();
            cancelForm();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (role: RoleItem) => {
        if (!confirm(`Hapus role "${role.nama}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/role/${role.id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menghapus role");
                return;
            }

            await fetchRoles();
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 flex font-sans">
            {/* --- SIDEBAR --- */}
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex-col hidden md:flex">
                <div className="flex items-center gap-2 px-6 py-6">
                    <img
                        src="/assets/sigurakost.png"
                        alt="SiguraKost logo"
                        className="w-6 h-6 object-contain bg-slate-200 rounded-sm"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <span className="text-lg font-extrabold text-blue-700 tracking-tight">
                        SiguraKost
                    </span>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto">
                    <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Menu
                    </p>
                    <ul className="space-y-1 mb-6">
                        {menuItems.map(({ label, icon: Icon, path, active }) => (
                            <li key={label}>
                                <button
                                    onClick={() => navigate(path)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                        active
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                >
                                    <Icon className="w-[18px] h-[18px]" />
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Account Settings
                    </p>
                    <ul className="space-y-1">
                        {accountItems.map(({ label, icon: Icon, path, active }) => (
                            <li key={label}>
                                <button
                                    onClick={() => navigate(path)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                        active
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                >
                                    <Icon className="w-[18px] h-[18px]" />
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between gap-4 px-8 py-5 bg-slate-100/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200/50">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-800">
                            {view === "list" && "Manage Roles"}
                            {view === "add" && "Add New Role"}
                            {view === "edit" && "Edit Role"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari role..."
                                value={view === "list" ? searchQuery : ""}
                                onChange={(e) => {
                                    if (view === "list") setSearchQuery(e.target.value);
                                }}
                                disabled={view !== "list"}
                                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            />
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                            <img
                                src={user?.foto || "/assets/wong.jpg"}
                                alt="User avatar"
                                className="w-9 h-9 rounded-full object-cover bg-slate-300"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                            <div className="hidden md:block leading-tight">
                                <p className="text-sm font-semibold text-slate-800">
                                    {user?.nama || "Loading..."}
                                </p>
                                <p className="text-xs text-slate-400">{user?.email}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-8 pb-8 pt-4 overflow-y-auto">
                    {view === "list" && (
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 mb-6 flex items-center justify-between gap-4 shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="w-5 h-5 text-blue-700" />
                                        <p className="text-lg font-bold text-slate-800">
                                            {filteredRoles.length}{" "}
                                            {searchQuery ? `hasil untuk "${searchQuery}"` : "Total Roles"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        View and update your Roles here.
                                    </p>
                                </div>
                                <button
                                    onClick={openAddForm}
                                    className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition shrink-0 shadow-sm"
                                >
                                    Add New
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <p className="text-base font-semibold text-slate-800 mb-4">
                                    All Roles
                                </p>

                                {loadingRoles ? (
                                    <div className="py-12 text-center text-sm text-slate-400">
                                        Memuat data role...
                                    </div>
                                ) : filteredRoles.length === 0 ? (
                                    <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">
                                        <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-slate-600">
                                            {searchQuery ? "Tidak ada role ditemukan" : "Belum ada role"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredRoles.map((role) => (
                                            <div
                                                key={role.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                                                        <Shield className="w-[18px] h-[18px] text-slate-400" />
                                                    </div>
                                                    {/* ✅ capitalize di CSS karena data asli huruf kecil */}
                                                    <p className="text-sm font-bold text-slate-800 capitalize">
                                                        {role.nama}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
                                                    <User className="w-3.5 h-3.5" />
                                                    {role.total_users ?? 0} Total User
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditForm(role)}
                                                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold px-5 py-2 rounded-full transition"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(role)}
                                                        className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-3.5 py-2 rounded-full transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(view === "add" || view === "edit") && (
                        <div className="max-w-6xl mx-auto space-y-6">
                            <button
                                onClick={cancelForm}
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Manage Roles
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-base font-bold text-slate-800 mb-6">
                                        Complete The Form
                                    </h2>

                                    <form onSubmit={submitRole} className="space-y-5">
                                        {/* Cuma satu field: nama */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Shield className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="nama"
                                                value={formData.nama}
                                                onChange={handleFormChange}
                                                placeholder="Role Name"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={cancelForm}
                                                disabled={submitting}
                                                className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-6 py-2.5 rounded-full text-sm transition disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition shadow-sm disabled:opacity-50"
                                            >
                                                {submitting ? "Menyimpan..." : "Save Role"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
                                    <h3 className="text-sm font-bold text-slate-800 mb-5">
                                        {view === "edit"
                                            ? "Quick Guide to Update Role"
                                            : "Quick Guide to Add New Role"}
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            "Gunakan nama role yang jelas dan spesifik, misalnya manager atau keeper.",
                                            "Hindari Role Duplikat – nama role harus unik, sistem akan menolak nama yang sudah ada.",
                                            "Role yang masih dipakai user tidak dapat dihapus.",
                                            "Periksa kembali nama role sebelum menyimpan.",
                                        ].map((text, i) => (
                                            <li key={i} className="flex gap-3 items-start">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                                <span className="text-xs text-slate-500 leading-relaxed">
                                                    {text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}