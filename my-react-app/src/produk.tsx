import { type ChangeEvent, type FormEvent, useRef, useState, useEffect } from "react";
import { useUser } from "./context/UserContext";
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
    ChevronLeft,
    ChevronDown,
    Plus,
    Smartphone,
    X,
    ImagePlus,
    Sparkles,
    Tag,
    Layers,
    FileText,
    CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

type Kategori = {
    id: number;
    name: string;
};

type ProdukData = {
    id: number;
    nama: string;
    thumbnail: string | null;
    deskripsi: string | null;
    harga: number;
    kategori_id: number;
    is_popular: boolean;
    kategori?: Kategori;
};

type NewProduct = {
    nama: string;
    harga: string;
    kategori_id: string;
    is_popular: boolean;
    deskripsi: string;
    thumbnail: string | null;
};

type ViewMode = "list" | "add";

const emptyNewProduct: NewProduct = {
    nama: "",
    harga: "",
    kategori_id: "",
    is_popular: false,
    deskripsi: "",
    thumbnail: null,
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function ProductsPage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [view, setView] = useState<ViewMode>("list");
    const [selectedProduct, setSelectedProduct] = useState<ProdukData | null>(null);
    const [newProduct, setNewProduct] = useState<NewProduct>(emptyNewProduct);

    const [products, setProducts] = useState<ProdukData[]>([]);
    const [kategoriList, setKategoriList] = useState<Kategori[]>([]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // ✅ State search
    const [searchQuery, setSearchQuery] = useState("");

    const menuItems = [
        { label: "Beranda", icon: Home, path: "/dashboard" },
        { label: "Produk", icon: Package, path: "/produk", active: true },
        { label: "Kategori", icon: Tags, path: "/kategori" },
        { label: "Warehouse", icon: Warehouse, path: "/warehouse" },
        { label: "Merchant", icon: Store, path: "/merchant" },
    ];

    const accountItems = [
        { label: "Roles", icon: ShieldCheck, path: "/role" },
        { label: "Manajemen User", icon: Users, path: "/manageUser" },
        { label: "Settings", icon: Settings, path: "/settings" },
    ];

    const quickGuide = [
        "Gunakan foto yang jelas dan berkualitas tinggi untuk hasil terbaik",
        "Pastikan nama produk relevan dan deskriptif",
        "Pilih kategori produk yang paling sesuai",
        "Ukuran foto maksimal 2MB untuk proses unggah",
        "Periksa kembali semua data sebelum menyimpan",
    ];

    const fetchProducts = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/produk`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) setProducts(await res.json());
    };

    const fetchKategori = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/kategori`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) setKategoriList(await res.json());
    };

    useEffect(() => {
        fetchProducts();
        fetchKategori();
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ✅ Filter produk — cocokkan nama dan nama kategori
    const filteredProducts = products.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            p.nama.toLowerCase().includes(q) ||
            (p.kategori?.name ?? "").toLowerCase().includes(q)
        );
    });

    const handleAddProductChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const target = e.currentTarget;
        const name = target.name as keyof NewProduct;
        const value = target.value;
        setNewProduct((prev) => ({ ...prev, [name]: value } as NewProduct));
    };

    const handlePhotoPick = () => fileInputRef.current?.click();

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert("Ukuran foto maksimal 2MB");
            e.currentTarget.value = "";
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("File yang dipilih harus berupa gambar");
            e.currentTarget.value = "";
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setSelectedFile(file);
        e.currentTarget.value = "";
    };

    const openAddPage = () => {
        setNewProduct(emptyNewProduct);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("add");
    };

    const closeAddPage = () => {
        setNewProduct(emptyNewProduct);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView("list");
    };

    const uploadPhoto = async (file: File): Promise<string> => {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "produk");

        const res = await fetch(`${API_URL}/upload/image`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal upload foto");
        return data.url as string;
    };

    const handleAddProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let thumbnailUrl = newProduct.thumbnail;

            if (selectedFile) {
                try {
                    thumbnailUrl = await uploadPhoto(selectedFile);
                } catch (err) {
                    alert(err instanceof Error ? err.message : "Gagal upload foto");
                    return;
                }
            }

            if (thumbnailUrl && thumbnailUrl.startsWith("data:")) {
                alert("Foto tidak valid. Silakan pilih ulang foto.");
                return;
            }

            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/produk`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nama: newProduct.nama,
                    harga: Number(newProduct.harga.replace(/[^0-9]/g, "")),
                    kategori_id: Number(newProduct.kategori_id),
                    is_popular: newProduct.is_popular,
                    deskripsi: newProduct.deskripsi,
                    thumbnail: thumbnailUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menambah produk");
                return;
            }

            await fetchProducts();
            closeAddPage();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmitting(false);
        }
    };

    const displayedPhoto = previewUrl ?? newProduct.thumbnail;

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
                    <div>
                        <h1 className="text-lg font-semibold text-slate-800">
                            {view === "list" ? "Manajemen Produk" : "Add New Product"}
                        </h1>
                        {view === "add" && (
                            <button
                                type="button"
                                onClick={closeAddPage}
                                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 transition"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Manage Products
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        {/* ✅ Search hanya aktif di view list */}
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari produk atau kategori..."
                                value={view === "list" ? searchQuery : ""}
                                onChange={(e) => {
                                    if (view === "list") setSearchQuery(e.target.value);
                                }}
                                disabled={view !== "list"}
                                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-default"
                            />
                            {/* ✅ Tombol clear search */}
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
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            {/* Card header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                <p className="text-base font-semibold text-slate-800">
                                    <span className="text-blue-700">{filteredProducts.length}</span>{" "}
                                    {/* ✅ Label berubah saat search aktif */}
                                    {searchQuery
                                        ? `hasil untuk "${searchQuery}"`
                                        : "Total Produk"}
                                </p>
                                <button
                                    onClick={openAddPage}
                                    className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-full transition"
                                >
                                    Add Product
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                                            <th className="px-5 py-3 font-medium">Product Name</th>
                                            <th className="px-5 py-3 font-medium">Price</th>
                                            <th className="px-5 py-3 font-medium">Kategori</th>
                                            <th className="px-5 py-3 font-medium">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* ✅ Render dari filteredProducts, bukan products */}
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-5 py-10 text-center text-sm text-slate-400"
                                                >
                                                    {searchQuery
                                                        ? `Tidak ada produk dengan kata kunci "${searchQuery}"`
                                                        : "Belum ada produk"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    className="border-t border-slate-100 hover:bg-slate-50 transition"
                                                >
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                                {p.thumbnail ? (
                                                                    <img
                                                                        src={p.thumbnail}
                                                                        alt={p.nama}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <Smartphone className="w-4 h-4 text-slate-400" />
                                                                )}
                                                            </div>
                                                            {/* ✅ Highlight teks yang cocok dengan query */}
                                                            <span className="font-medium text-slate-700">
                                                                {p.nama}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500">
                                                        Rp {Number(p.harga).toLocaleString("id-ID")}
                                                    </td>
                                                    <td className="px-5 py-3 text-slate-500">
                                                        {p.kategori?.name ?? "-"}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <button
                                                            onClick={() => setSelectedProduct(p)}
                                                            className="inline-flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                                                        >
                                                            Detail
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddProductSubmit} className="max-w-6xl">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-800 mb-4">
                                        Complete The Form
                                    </p>

                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <button
                                            type="button"
                                            onClick={handlePhotoPick}
                                            className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-blue-400 hover:bg-blue-50 transition"
                                            aria-label="Upload product thumbnail"
                                        >
                                            {displayedPhoto ? (
                                                <img
                                                    src={displayedPhoto}
                                                    alt="Product preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ImagePlus className="w-5 h-5 text-slate-400" />
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
                                        <p className="text-xs text-slate-400 mb-3">
                                            Foto "{selectedFile.name}" akan diupload saat kamu klik Create Now
                                        </p>
                                    )}

                                    <div className="space-y-3 mt-3">
                                        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="text-sm font-semibold text-slate-800">
                                                    Produk Populer?
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setNewProduct((prev) => ({
                                                        ...prev,
                                                        is_popular: !prev.is_popular,
                                                    }))
                                                }
                                                className={`relative w-11 h-6 rounded-full transition ${
                                                    newProduct.is_popular ? "bg-blue-600" : "bg-slate-300"
                                                }`}
                                            >
                                                <span
                                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                        newProduct.is_popular
                                                            ? "translate-x-5"
                                                            : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </label>

                                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-blue-400 transition">
                                            <Package className="w-4 h-4 text-slate-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-slate-400">Product Name</p>
                                                <input
                                                    name="nama"
                                                    type="text"
                                                    value={newProduct.nama}
                                                    onChange={handleAddProductChange}
                                                    placeholder="Masukkan nama produk"
                                                    required
                                                    className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                                                />
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-blue-400 transition">
                                            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-slate-400">Product Price</p>
                                                <input
                                                    name="harga"
                                                    type="text"
                                                    value={newProduct.harga}
                                                    onChange={handleAddProductChange}
                                                    placeholder="Rp 0"
                                                    required
                                                    className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                                                />
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-blue-300 transition">
                                            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-slate-400">Product Category</p>
                                                <select
                                                    name="kategori_id"
                                                    value={newProduct.kategori_id}
                                                    onChange={handleAddProductChange}
                                                    required
                                                    className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none appearance-none"
                                                >
                                                    <option value="" disabled>
                                                        Pilih kategori
                                                    </option>
                                                    {kategoriList.map((k) => (
                                                        <option key={k.id} value={k.id}>
                                                            {k.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                        </label>

                                        <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-blue-400 transition">
                                            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-slate-400 mb-1">Product About</p>
                                                <textarea
                                                    name="deskripsi"
                                                    rows={3}
                                                    value={newProduct.deskripsi}
                                                    onChange={handleAddProductChange}
                                                    placeholder="Deskripsi singkat produk"
                                                    className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
                                                />
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 pt-5">
                                        <button
                                            type="button"
                                            onClick={closeAddPage}
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
                                            {submitting ? "Menyimpan..." : "Create Now"}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 h-fit">
                                    <p className="text-sm font-semibold text-slate-800 mb-3">
                                        Quick Guide to Adding Products
                                    </p>
                                    <ul className="space-y-3">
                                        {quickGuide.map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <span className="text-xs text-slate-500 leading-relaxed">
                                                    {tip}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </form>
                    )}
                </main>
            </div>

            {/* Product Details modal */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Product Details</h2>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                aria-label="Close"
                                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-base font-bold text-slate-800 truncate">
                                        {selectedProduct.nama}
                                    </span>
                                </div>
                                <p className="text-base font-bold text-slate-800 mb-1">
                                    {selectedProduct.kategori?.name ?? "-"}
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                    Rp {Number(selectedProduct.harga).toLocaleString("id-ID")}
                                </p>

                                <div className="border-t border-slate-100 my-4" />

                                <p className="text-sm text-slate-400 mb-1">Product About</p>
                                <p className="text-base font-bold text-slate-800">
                                    {selectedProduct.deskripsi || "-"}
                                </p>
                            </div>

                            <div className="shrink-0 w-24 h-24 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                                {selectedProduct.thumbnail ? (
                                    <img
                                        src={selectedProduct.thumbnail}
                                        alt={selectedProduct.nama}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Smartphone className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}