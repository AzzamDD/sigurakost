import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
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
    Phone,
    Mail,
    Lock,
    Image as ImageIcon,
    CheckCircle2,
    ChevronDown,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/* ---------- Types ---------- */
type RoleData = {
    id: number;
    nama: string;
    deskripsi?: string | null;
};

type UserItem = {
    id: number;
    nama: string;
    email: string;
    no_hp: string | null;
    foto: string | null;
    role_id: number | null;
    role?: RoleData | null;
};

type UserForm = {
    nama: string;
    no_hp: string;
    email: string;
    role_id: string; // string biar kompatibel <select>
    password: string;
    passwordConfirmation: string;
    foto: string | null;
};

type ViewMode = "list" | "add" | "edit";

const emptyUserForm: UserForm = {
    nama: "",
    no_hp: "",
    email: "",
    role_id: "",
    password: "",
    passwordConfirmation: "",
    foto: null,
};

export default function ManageUserPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [view, setView] = useState<ViewMode>("list");
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    const [formData, setFormData] = useState<UserForm>(emptyUserForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        { label: "Roles", icon: ShieldCheck, path: "/role", active: false },
        // ✅ disamakan casing-nya jadi "/manageUser" — cek route definition kamu
        { label: "Manajemen User", icon: Users, path: "/manageUser", active: true },
        { label: "Settings", icon: Settings, path: "/settings", active: false },
    ];

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return { Authorization: `Bearer ${token}`, Accept: "application/json" };
    };

    /* ---------- Fetch ---------- */
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API_URL}/pengguna`, { headers: authHeaders() });
            if (res.ok) setUsers(await res.json());
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const res = await fetch(`${API_URL}/role`, { headers: authHeaders() });
            if (res.ok) setRoles(await res.json());
        } finally {
            setLoadingRoles(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const filteredUsers = users.filter((u) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            u.nama.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.role?.nama ?? "").toLowerCase().includes(q)
        );
    });

    /* ---------- Form ---------- */
    const handleFormChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const openAddForm = () => {
        setFormData(emptyUserForm);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("add");
    };

    const openEditForm = (u: UserItem) => {
        setFormData({
            nama: u.nama,
            no_hp: u.no_hp ?? "",
            email: u.email,
            role_id: u.role_id ? String(u.role_id) : "",
            password: "",
            passwordConfirmation: "",
            foto: u.foto,
        });
        setEditingId(u.id);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("edit");
    };

    const cancelForm = () => {
        setFormData(emptyUserForm);
        setEditingId(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("list");
    };

    const handlePhotoPick = () => fileInputRef.current?.click();

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            alert("Ukuran foto maksimal 2MB");
            e.target.value = "";
            return;
        }
        if (!file.type.startsWith("image/")) {
            alert("File yang dipilih harus berupa gambar");
            e.target.value = "";
            return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setSelectedFile(file);
        e.target.value = "";
    };

    // Reuse endpoint upload yang sama dengan Merchant — folder beda biar terorganisir
    const uploadPhoto = async (file: File): Promise<string> => {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("folder", "pengguna");
        const res = await fetch(`${API_URL}/upload/image`, {
            method: "POST",
            headers: authHeaders(),
            body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal upload foto");
        return data.url as string;
    };

    const submitUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validasi password cuma dicek kalau diisi (edit) atau wajib (add)
        if (view === "add" || formData.password || formData.passwordConfirmation) {
            if (formData.password !== formData.passwordConfirmation) {
                alert("Password dan konfirmasi password tidak sama.");
                return;
            }
        }

        setSubmitting(true);

        try {
            let fotoUrl = formData.foto;

            if (selectedFile) {
                try {
                    fotoUrl = await uploadPhoto(selectedFile);
                } catch (err) {
                    alert(err instanceof Error ? err.message : "Gagal upload foto");
                    return;
                }
            }

            const isEdit = editingId !== null;
            const url = isEdit ? `${API_URL}/pengguna/${editingId}` : `${API_URL}/pengguna`;
            const method = isEdit ? "PUT" : "POST";

            const payload: Record<string, unknown> = {
                nama: formData.nama,
                email: formData.email,
                no_hp: formData.no_hp,
                foto: fotoUrl,
                role_id: formData.role_id ? Number(formData.role_id) : null,
            };

            // ✅ Password cuma dikirim kalau diisi — biar gak overwrite password lama pas edit kosong
            if (formData.password) {
                payload.password = formData.password;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    alert(Array.isArray(firstError) ? firstError[0] : "Data tidak valid");
                } else {
                    alert(data.message || "Gagal menyimpan user");
                }
                return;
            }

            await fetchUsers();
            cancelForm();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (u: UserItem) => {
        if (!confirm(`Hapus user "${u.nama}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/pengguna/${u.id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menghapus user");
                return;
            }

            await fetchUsers();
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    };

    const displayedPhoto = previewUrl ?? formData.foto;

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
                            {view === "list" && "Manage Users"}
                            {view === "add" && "Add New User"}
                            {view === "edit" && "Edit User"}
                        </h1>
                        {view !== "list" && (
                            <button
                                onClick={cancelForm}
                                className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 hover:text-slate-600 transition"
                            >
                                <ChevronLeft className="w-3 h-3" />
                                Manage Users
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari user..."
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
                                        <Users className="w-5 h-5 text-blue-700" />
                                        <p className="text-lg font-bold text-slate-800">
                                            {filteredUsers.length}{" "}
                                            {searchQuery ? `hasil untuk "${searchQuery}"` : "Total Users"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        View and update Total User list here.
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
                                    All Users
                                </p>

                                {loadingUsers ? (
                                    <div className="py-12 text-center text-sm text-slate-400">
                                        Memuat data user...
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">
                                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-slate-600">
                                            {searchQuery ? "Tidak ada user ditemukan" : "Belum ada user"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredUsers.map((u) => (
                                            <div
                                                key={u.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {u.foto ? (
                                                            <img
                                                                src={u.foto}
                                                                alt={u.nama}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {u.nama}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {u.no_hp || "-"}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                                            <Mail className="w-3 h-3" />
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-[11px] text-slate-400 leading-none mb-1">
                                                            User Role
                                                        </p>
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            {u.role?.nama ?? "Belum ada role"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditForm(u)}
                                                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold px-5 py-2 rounded-full transition"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(u)}
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
                                Manage Users
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                    <h2 className="text-base font-bold text-slate-800 mb-6">
                                        Complete The Form
                                    </h2>

                                    <form onSubmit={submitUser} className="space-y-5">
                                        {/* Photo */}
                                        <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                {displayedPhoto ? (
                                                    <img
                                                        src={displayedPhoto}
                                                        alt="User preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePhotoPick}
                                                className="bg-slate-900 hover:bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                                            >
                                                {displayedPhoto ? "Change Photo" : "Add Photo"}
                                            </button>
                                        </div>

                                        {selectedFile && (
                                            <p className="text-xs text-slate-400">
                                                Foto "{selectedFile.name}" akan diupload saat kamu klik simpan
                                            </p>
                                        )}

                                        {/* Full Name */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="nama"
                                                value={formData.nama}
                                                onChange={handleFormChange}
                                                placeholder="Full Name"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Phone className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="no_hp"
                                                value={formData.no_hp}
                                                onChange={handleFormChange}
                                                placeholder="Phone Number"
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleFormChange}
                                                placeholder="Email Address"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                        </div>

                                        {/* Role — dinamis dari /role, bukan hardcode */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <ShieldCheck className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <select
                                                name="role_id"
                                                value={formData.role_id}
                                                onChange={handleFormChange}
                                                disabled={loadingRoles}
                                                className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                                            >
                                                <option value="">
                                                    {loadingRoles ? "Memuat role..." : "Select User Role"}
                                                </option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.nama}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleFormChange}
                                                placeholder="Password"
                                                required={view === "add"}
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                        </div>

                                        {/* Password Confirmation */}
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="passwordConfirmation"
                                                value={formData.passwordConfirmation}
                                                onChange={handleFormChange}
                                                placeholder="Password Confirmation"
                                                required={view === "add"}
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            />
                                        </div>

                                        {view === "edit" && (
                                            <p className="text-xs text-slate-400 -mt-2">
                                                Kosongkan password jika tidak ingin mengubahnya.
                                            </p>
                                        )}

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
                                                {submitting ? "Menyimpan..." : "Save User"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
                                    <h3 className="text-sm font-bold text-slate-800 mb-5">
                                        Quick Guide to Add User
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            "Masukkan detail pengguna dengan akurat dan lengkap untuk memastikan fungsi sistem yang tepat.",
                                            "Tetapkan role jika diperlukan untuk memastikan akses yang sesuai untuk fungsi mereka.",
                                            "Buat password awal untuk memastikan akses pengguna yang aman sambil menjaga kerahasiaan akun.",
                                            "Pastikan Email dan Nomor Telepon benar untuk menghindari kesalahan.",
                                            "Ulas secara menyeluruh semua detail sebelum membuat untuk memastikan akurasi dan mencegah kesalahan potensial.",
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