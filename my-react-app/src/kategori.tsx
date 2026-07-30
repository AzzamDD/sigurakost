import { type ChangeEvent, type FormEvent, useRef, useState, useEffect } from "react";
import { useUser } from "./context/UserContext";
import { useNavigate } from "react-router-dom";
import {
    Home,
    Package,
    Tags,
    Warehouse,
    Store,
    ShieldCheck,
    Users,
    Settings,
    Search,
    ChevronRight,
    ArrowLeft,
    Plus,
    Pencil,
    ImagePlus,
    Layers,
    CheckCircle2,
    AlignLeft,
    X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL + "/api" ||"http://localhost:8000/api";

type Category = {
    id: number;
    name: string;
    tagline: string | null;
    foto: string | null;
    produk_count?: number;
};

type CategoryForm = {
    name: string;
    tagline: string;
    foto: string | null;
};

type View = "list" | "add" | "edit";

const emptyForm: CategoryForm = { name: "", tagline: "", foto: null };

const quickGuideTips = [
    "Gunakan foto yang jelas dan berkualitas tinggi untuk hasil terbaik",
    "Pastikan nama produk relevan dan deskriptif",
    "Pilih kategori produk yang paling sesuai",
    "Ukuran foto maksimal 2MB untuk proses unggah",
    "Periksa kembali semua data sebelum menyimpan",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function CategoriesPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [view, setView] = useState<View>("list");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<CategoryForm>(emptyForm);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // ✅ State search
    const [searchQuery, setSearchQuery] = useState("");

    const menuItems = [
        { label: "Beranda", icon: Home, path: "/dashboard" },
        { label: "Produk", icon: Package, path: "/produk" },
        { label: "Kategori", icon: Tags, path: "/kategori", active: true },
        { label: "Warehouse", icon: Warehouse, path: "/warehouse" },
        { label: "Merchant", icon: Store, path: "/merchant" },
    ];

    const accountItems = [
        { label: "Roles", icon: ShieldCheck, path: "/role" },
        { label: "Manajemen User", icon: Users, path: "/manageUser" },
        { label: "Settings", icon: Settings, path: "/settings" },
    ];

    const fetchCategories = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/kategori`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) setCategories(await res.json());
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ✅ Filter kategori — cocokkan name dan tagline
    const filteredCategories = categories.filter((cat) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            cat.name.toLowerCase().includes(q) ||
            (cat.tagline ?? "").toLowerCase().includes(q)
        );
    });

    const handleFormChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
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

    const openAddModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("add");
    };

    const openEditModal = (category: Category) => {
        setEditingId(category.id);
        setForm({
            name: category.name,
            tagline: category.tagline ?? "",
            foto: category.foto,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("edit");
    };

    const closeModal = () => {
        setView("list");
        setEditingId(null);
        setForm(emptyForm);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const uploadPhoto = async (file: File): Promise<string> => {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "kategori");

        const res = await fetch(`${API_URL}/upload/image`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal upload foto");
        return data.url as string;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let fotoUrl = form.foto;

            if (selectedFile) {
                try {
                    fotoUrl = await uploadPhoto(selectedFile);
                } catch (err) {
                    alert(err instanceof Error ? err.message : "Gagal upload foto");
                    return;
                }
            }

            if (fotoUrl && fotoUrl.startsWith("data:")) {
                alert("Foto tidak valid. Silakan pilih ulang foto.");
                return;
            }

            const token = localStorage.getItem("token");
            const isEdit = editingId !== null;
            const url = isEdit
                ? `${API_URL}/kategori/${editingId}`
                : `${API_URL}/kategori`;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: form.name,
                    tagline: form.tagline,
                    foto: fotoUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menyimpan kategori");
                return;
            }

            await fetchCategories();
            closeModal();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmitting(false);
        }
    };

    const headerTitle =
        view === "list"
            ? "Manage Categories"
            : view === "add"
            ? "Add New Category"
            : "Edit Category";

    const displayedPhoto = previewUrl ?? form.foto;

    return (
        <div className="min-h-screen w-full bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-6 py-6">
                    <img
                        src="/assets/sigurakost.png"
                        alt="SiguraKost logo"
                        className="w-6 h-6 object-contain"
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
                        {accountItems.map(({ label, icon: Icon, path }) => (
                            <li key={label}>
                                <button
                                    onClick={() => navigate(path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                                >
                                    <Icon className="w-[18px] h-[18px]" />
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="flex items-center justify-between gap-4 px-8 py-5">
                    <h1 className="text-lg font-semibold text-slate-800">
                        {headerTitle}
                    </h1>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        {/* ✅ Search — aktif hanya di view list */}
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari kategori atau tagline..."
                                value={view === "list" ? searchQuery : ""}
                                onChange={(e) => {
                                    if (view === "list") setSearchQuery(e.target.value);
                                }}
                                disabled={view !== "list"}
                                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-default"
                            />
                            {/* ✅ Tombol clear */}
                            {searchQuery && view === "list" && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    aria-label="Hapus pencarian"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <img
                                src={user?.foto || "/assets/wong.jpg"}
                                alt="User avatar"
                                className="w-9 h-9 rounded-full object-cover bg-slate-200"
                            />
                            <div className="hidden md:block leading-tight">
                                <p className="text-sm font-semibold text-slate-800">
                                    {user?.nama || "Loading..."}
                                </p>
                                <p className="text-xs text-slate-400">{user?.email}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Body */}
                <main className="flex-1 px-8 pb-8 overflow-y-auto">
                    {view === "list" ? (
                        <>
                            {/* Summary card */}
                            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Tags className="w-4 h-4 text-blue-700" />
                                        <p className="text-base font-semibold text-slate-800">
                                            {/* ✅ Angka dan label berubah saat search aktif */}
                                            <span className="text-blue-700">
                                                {filteredCategories.length}
                                            </span>{" "}
                                            {searchQuery
                                                ? `hasil untuk "${searchQuery}"`
                                                : "Total Category"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        View and update your Category list here.
                                    </p>
                                </div>
                                <button
                                    onClick={openAddModal}
                                    className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-full transition shrink-0"
                                >
                                    Add New
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Category list */}
                            <p className="text-sm font-semibold text-slate-800 mb-3">
                                {searchQuery ? "Hasil Pencarian" : "All Categories"}
                            </p>

                            {/* ✅ Render dari filteredCategories */}
                            {filteredCategories.length === 0 ? (
                                <div className="bg-white rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
                                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500">
                                        {searchQuery
                                            ? `Tidak ada kategori dengan kata kunci "${searchQuery}"`
                                            : "Belum ada kategori"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {searchQuery
                                            ? "Coba kata kunci lain atau hapus pencarian."
                                            : `Klik "Add New" untuk menambahkan kategori pertama.`}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredCategories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {cat.foto ? (
                                                        <img
                                                            src={cat.foto}
                                                            alt={cat.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Layers className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                                        {cat.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {cat.tagline || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 shrink-0">
                                                <button
                                                    onClick={() => openEditModal(cat)}
                                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition"
                                                >
                                                    Edit
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Manage Categories
                            </button>

                            <form
                                onSubmit={handleSubmit}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
                            >
                                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                                    <h2 className="text-sm font-semibold text-slate-800 mb-6">
                                        Complete The Form
                                    </h2>

                                    <div className="flex items-start justify-between mb-8">
                                        <button
                                            type="button"
                                            onClick={handlePhotoPick}
                                            className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-blue-400 hover:bg-blue-50 transition shrink-0"
                                            aria-label="Upload category icon"
                                        >
                                            {displayedPhoto ? (
                                                <img
                                                    src={displayedPhoto}
                                                    alt="Category icon preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImagePlus className="w-5 h-5 text-slate-300" />
                                            )}
                                        </button>

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
                                            className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition"
                                        >
                                            {displayedPhoto ? "Change Photo" : "Add Photo"}
                                        </button>
                                    </div>

                                    {selectedFile && (
                                        <p className="text-xs text-slate-400 -mt-6 mb-6">
                                            Foto "{selectedFile.name}" akan diupload saat kamu klik Save Category
                                        </p>
                                    )}

                                    <div className="space-y-5 mb-10">
                                        <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                            <Tags className="w-4 h-4 text-slate-400 shrink-0" />
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                value={form.name}
                                                onChange={handleFormChange}
                                                placeholder="Category Name"
                                                required
                                                className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                            <AlignLeft className="w-4 h-4 text-slate-400 shrink-0" />
                                            <input
                                                id="tagline"
                                                name="tagline"
                                                type="text"
                                                value={form.tagline}
                                                onChange={handleFormChange}
                                                placeholder="Category Tagline"
                                                className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            disabled={submitting}
                                            className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? "Menyimpan..." : "Save Category"}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 p-5">
                                    <p className="text-sm font-semibold text-slate-800 mb-3">
                                        Quick Guide to Adding Products
                                    </p>
                                    <ul className="space-y-3">
                                        {quickGuideTips.map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="text-xs text-slate-500 leading-relaxed">
                                                    {tip}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}