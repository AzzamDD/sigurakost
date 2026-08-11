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
    ChevronDown,
    MapPin,
    Phone,
    Boxes,
    Plus,
    Pencil,
    X,
    ImagePlus,
    Package2,
    CheckCircle2,
    Smartphone,
    Receipt,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/* ---------- Produk (sumber asli dari /produk) ---------- */

type Kategori = {
    id: number;
    name: string;
};

type ProdukData = {
    id: number;
    nama: string;
    thumbnail: string | null;
    harga: number;
    kategori_id: number;
    kategori?: Kategori;
};

/* ---------- Gudang & Stok Gudang (sumber asli dari /gudang & /stok-gudang) ---------- */

type GudangItem = {
    id: number;
    nama: string;
    alamat: string | null;
    foto: string | null;
    no_hp: string | null;
    produk_count?: number;
};

type StokGudangItem = {
    id: number;
    gudang_id: number;
    produk_id: number;
    stok: number;
    produk?: ProdukData;
};

type GudangForm = {
    nama: string;
    alamat: string;
    no_hp: string;
    foto: string | null;
};

type View = "list" | "detail" | "warehouse-form" | "product-form";
type FormOrigin = "list" | "detail";

const emptyWarehouseForm: GudangForm = { nama: "", alamat: "", no_hp: "", foto: null };

const productTips = [
    "Pilih Produk – Pilih dari daftar produk yang sudah terdaftar di menu Produk.",
    "Isi Stok Awal – Masukkan jumlah stok yang akan ditempatkan di gudang ini.",
    "Data Otomatis – Harga, kategori, dan foto akan otomatis mengikuti data produk yang dipilih.",
    "Belum Ada Produknya? – Tambahkan dulu di menu Produk sebelum bisa di-assign ke gudang.",
    "Periksa dan Simpan – Pastikan produk dan jumlah stok sudah benar sebelum menyimpan.",
];

const warehouseTips = [
    "Masukkan Nama Gudang – Gunakan nama gudang yang jelas dan mudah dikenali.",
    "Isi Nomor Telepon – Masukkan nomor telepon yang aktif untuk memudahkan komunikasi.",
    "Lengkapi Alamat Gudang – Isi alamat gudang secara lengkap agar lokasi mudah ditemukan.",
    "Unggah Gambar Gudang – Tambahkan foto atau logo gudang yang jelas sebagai identitas.",
    "Periksa dan Simpan Data – Pastikan semua informasi sudah benar, lalu klik Simpan untuk menambahkan gudang.",
];

export default function WarehousePage() {
    const navigate = useNavigate();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [warehouses, setWarehouses] = useState<GudangItem[]>([]);
    const [loadingWarehouses, setLoadingWarehouses] = useState(true);

    const [view, setView] = useState<View>("list");
    const [activeWarehouseId, setActiveWarehouseId] = useState<number | null>(null);

    const [activeWarehouseProducts, setActiveWarehouseProducts] = useState<StokGudangItem[]>([]);
    const [loadingWarehouseProducts, setLoadingWarehouseProducts] = useState(false);

    // Warehouse add/edit form
    const [editingWarehouseId, setEditingWarehouseId] = useState<number | null>(null);
    const [warehouseForm, setWarehouseForm] = useState<GudangForm>(emptyWarehouseForm);
    const [warehouseFormOrigin, setWarehouseFormOrigin] = useState<FormOrigin>("list");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submittingWarehouse, setSubmittingWarehouse] = useState(false);

    // Assign product form
    const [produkList, setProdukList] = useState<ProdukData[]>([]);
    const [loadingProduk, setLoadingProduk] = useState(true);
    const [selectedProdukId, setSelectedProdukId] = useState<string>("");
    const [assignStock, setAssignStock] = useState<string>("");
    const [submittingAssign, setSubmittingAssign] = useState(false);

    // Add stock modal
    const [stockTargetId, setStockTargetId] = useState<number | null>(null);
    const [stockAmount, setStockAmount] = useState("");
    const [submittingStock, setSubmittingStock] = useState(false);

    // Product details popup
    const [detailProduct, setDetailProduct] = useState<StokGudangItem | null>(null);

    // ✅ State search untuk gudang
    const [searchQuery, setSearchQuery] = useState("");

    // ✅ State search untuk produk di warehouse
    const [productSearchQuery, setProductSearchQuery] = useState("");

const menuItems = [
    { label: "Beranda", icon: Home, path: "/dashboard", active: false },
    { label: "Produk", icon: Package, path: "/produk", active: false },
    { label: "Kategori", icon: Tags, path: "/kategori", active: false },
    { label: "Warehouse", icon: WarehouseIcon, path: "/warehouse", active: true },
    { label: "Merchant", icon: Store, path: "/merchant", active: false },
    { label: "Transaksi", icon: Receipt, path: "/transaksi", active: false },
];

    const accountItems = [
        { label: "Roles", icon: ShieldCheck, path: "/role" },
        { label: "Manajemen User", icon: Users, path: "/manageUser" },
        { label: "Settings", icon: Settings, path: "/settings" },
    ];

    const authHeaders = () => {
        const token = localStorage.getItem("token");
        return { Authorization: `Bearer ${token}`, Accept: "application/json" };
    };

    /* ---------- Fetch: Gudang ---------- */

    const fetchWarehouses = async () => {
        setLoadingWarehouses(true);
        try {
            const res = await fetch(`${API_URL}/gudang`, { headers: authHeaders() });
            if (res.ok) setWarehouses(await res.json());
        } finally {
            setLoadingWarehouses(false);
        }
    };

    /* ---------- Fetch: Produk (buat dropdown assign) ---------- */

    const fetchProduk = async () => {
        setLoadingProduk(true);
        try {
            const res = await fetch(`${API_URL}/produk`, { headers: authHeaders() });
            if (res.ok) setProdukList(await res.json());
        } finally {
            setLoadingProduk(false);
        }
    };

    /* ---------- Fetch: Stok Gudang untuk 1 warehouse ---------- */

    const fetchWarehouseProducts = async (gudangId: number) => {
        setLoadingWarehouseProducts(true);
        try {
            const res = await fetch(`${API_URL}/stok-gudang?gudang_id=${gudangId}`, {
                headers: authHeaders(),
            });
            if (res.ok) setActiveWarehouseProducts(await res.json());
        } finally {
            setLoadingWarehouseProducts(false);
        }
    };

    useEffect(() => {
        fetchWarehouses();
        fetchProduk();
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ✅ Filter gudang berdasarkan nama dan alamat
    const filteredWarehouses = warehouses.filter((w) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            w.nama.toLowerCase().includes(q) ||
            (w.alamat ?? "").toLowerCase().includes(q)
        );
    });

    // ✅ Filter produk di warehouse berdasarkan nama produk dan kategori
    const filteredWarehouseProducts = activeWarehouseProducts.filter((sg) => {
        const q = productSearchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            sg.produk?.nama.toLowerCase().includes(q) ||
            (sg.produk?.kategori?.name ?? "").toLowerCase().includes(q)
        );
    });

    const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId) ?? null;

    /* ---------- Warehouse list actions ---------- */

    const openWarehouseDetail = (w: GudangItem) => {
        setActiveWarehouseId(w.id);
        setView("detail");
        fetchWarehouseProducts(w.id);
        setProductSearchQuery(""); // Reset search produk saat pindah warehouse
    };

    const backToList = () => {
        setView("list");
        setActiveWarehouseId(null);
        setActiveWarehouseProducts([]);
        setSearchQuery(""); // Reset search saat kembali ke list
    };

    const openAddWarehouse = () => {
        setEditingWarehouseId(null);
        setWarehouseForm(emptyWarehouseForm);
        setSelectedFile(null);
        setPreviewUrl(null);
        setWarehouseFormOrigin("list");
        setView("warehouse-form");
    };

    const openEditWarehouse = (w: GudangItem, origin: FormOrigin) => {
        setEditingWarehouseId(w.id);
        setWarehouseForm({
            nama: w.nama,
            alamat: w.alamat ?? "",
            no_hp: w.no_hp ?? "",
            foto: w.foto,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setWarehouseFormOrigin(origin);
        setActiveWarehouseId(w.id);
        setView("warehouse-form");
    };

    const closeWarehouseForm = () => {
        setEditingWarehouseId(null);
        setWarehouseForm(emptyWarehouseForm);
        setSelectedFile(null);
        setPreviewUrl(null);
        setView(warehouseFormOrigin === "detail" ? "detail" : "list");
    };

    const handleWarehouseFormChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setWarehouseForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoPick = () => {
        fileInputRef.current?.click();
    };

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

    const uploadPhoto = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "gudang");

        const res = await fetch(`${API_URL}/upload/image`, {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal upload foto");
        return data.url as string;
    };

    const submitWarehouse = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmittingWarehouse(true);

        try {
            let fotoUrl = warehouseForm.foto;

            if (selectedFile) {
                try {
                    fotoUrl = await uploadPhoto(selectedFile);
                } catch (err) {
                    alert(err instanceof Error ? err.message : "Gagal upload foto");
                    return;
                }
            }

            const isEdit = editingWarehouseId !== null;
            const url = isEdit
                ? `${API_URL}/gudang/${editingWarehouseId}`
                : `${API_URL}/gudang`;
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({
                    nama: warehouseForm.nama,
                    alamat: warehouseForm.alamat,
                    no_hp: warehouseForm.no_hp,
                    foto: fotoUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menyimpan gudang");
                return;
            }

            await fetchWarehouses();
            setView(warehouseFormOrigin === "detail" ? "detail" : "list");
            setEditingWarehouseId(null);
            setWarehouseForm(emptyWarehouseForm);
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmittingWarehouse(false);
        }
    };

    /* ---------- Assign produk ke gudang ---------- */

    const openAssignForm = () => {
        setSelectedProdukId("");
        setAssignStock("");
        setView("product-form");
    };

    const closeProductForm = () => {
        setSelectedProdukId("");
        setAssignStock("");
        setView("detail");
    };

    const selectedProduk = produkList.find((p) => p.id === Number(selectedProdukId)) ?? null;

    const submitAssignProduct = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (activeWarehouseId === null || !selectedProduk) return;

        setSubmittingAssign(true);
        try {
            const res = await fetch(`${API_URL}/stok-gudang`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({
                    gudang_id: activeWarehouseId,
                    produk_id: selectedProduk.id,
                    stok: Number(assignStock) || 0,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal assign produk ke gudang");
                return;
            }

            await fetchWarehouseProducts(activeWarehouseId);
            await fetchWarehouses(); // refresh produk_count di list
            closeProductForm();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmittingAssign(false);
        }
    };

    /* ---------- Product details popup ---------- */

    const openDetailModal = (product: StokGudangItem) => setDetailProduct(product);
    const closeDetailModal = () => setDetailProduct(null);

    /* ---------- Add stock ---------- */

    const openStockModal = (product: StokGudangItem) => {
        setStockTargetId(product.id);
        setStockAmount("");
    };

    const closeStockModal = () => {
        setStockTargetId(null);
        setStockAmount("");
    };

    const submitStock = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (activeWarehouseId === null || stockTargetId === null) return;

        setSubmittingStock(true);
        try {
            const res = await fetch(`${API_URL}/stok-gudang/${stockTargetId}/tambah-stok`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify({ stok: Number(stockAmount) || 0 }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal menambah stok");
                return;
            }

            await fetchWarehouseProducts(activeWarehouseId);
            closeStockModal();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmittingStock(false);
        }
    };

    const headerTitle =
        view === "list"
            ? "Manage Warehouses"
            : view === "detail"
            ? "Warehouse Details"
            : view === "warehouse-form"
            ? editingWarehouseId !== null
                ? "Edit Warehouse"
                : "Add New Warehouse"
            : "Assign a Product";

    const breadcrumbLabel =
        view === "detail"
            ? "Manage Warehouses"
            : view === "warehouse-form"
            ? warehouseFormOrigin === "detail"
                ? "Warehouse Details"
                : "Manage Warehouses"
            : view === "product-form"
            ? "Warehouse Details"
            : "";

    const handleBreadcrumb = () => {
        if (view === "detail") backToList();
        else if (view === "warehouse-form") closeWarehouseForm();
        else if (view === "product-form") closeProductForm();
    };

    const displayedPhoto = previewUrl ?? warehouseForm.foto;

    return (
        <div className="min-h-screen w-full bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-6 py-6">
                    <img
                        src="public/assets/sentra.svg"
                        alt="Sentra logo"
                        className="w-6 h-6 object-contain"
                    />
                    <span className="text-lg font-extrabold text-blue-700 tracking-tight">
                        Sentra
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
                        <h1 className="text-lg font-semibold text-slate-800">{headerTitle}</h1>
                        {breadcrumbLabel && (
                            <button
                                onClick={handleBreadcrumb}
                                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                {breadcrumbLabel}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        {/* ✅ Search input - aktif hanya di view list dan detail */}
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={
                                    view === "list"
                                        ? "Cari gudang atau alamat..."
                                        : view === "detail"
                                        ? "Cari produk atau kategori..."
                                        : "Search"
                                }
                                value={
                                    view === "list"
                                        ? searchQuery
                                        : view === "detail"
                                        ? productSearchQuery
                                        : ""
                                }
                                onChange={(e) => {
                                    if (view === "list") setSearchQuery(e.target.value);
                                    else if (view === "detail") setProductSearchQuery(e.target.value);
                                }}
                                disabled={view !== "list" && view !== "detail"}
                                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-default"
                            />
                            {/* ✅ Tombol clear */}
                            {(searchQuery && view === "list") ||
                            (productSearchQuery && view === "detail") ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (view === "list") setSearchQuery("");
                                        else if (view === "detail") setProductSearchQuery("");
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                    aria-label="Hapus pencarian"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : null}
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
                    {view === "list" && (
                        <>
                            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <WarehouseIcon className="w-4 h-4 text-blue-700" />
                                        <p className="text-base font-semibold text-slate-800">
                                            {/* ✅ Angka dan label berubah saat search aktif */}
                                            <span className="text-blue-700">{filteredWarehouses.length}</span>{" "}
                                            {searchQuery
                                                ? `hasil untuk "${searchQuery}"`
                                                : "Total Warehouses"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        View and update your Warehouses list here.
                                    </p>
                                </div>
                                <button
                                    onClick={openAddWarehouse}
                                    className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-full transition shrink-0"
                                >
                                    Add New
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-sm font-semibold text-slate-800 mb-3">
                                {searchQuery ? "Hasil Pencarian" : "All Warehouses"}
                            </p>

                            {loadingWarehouses ? (
                                <div className="bg-white rounded-xl border border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
                                    Memuat data gudang...
                                </div>
                            ) : filteredWarehouses.length === 0 ? (
                                <div className="bg-white rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
                                    <WarehouseIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500">
                                        {searchQuery
                                            ? `Tidak ada gudang dengan kata kunci "${searchQuery}"`
                                            : "Belum ada warehouse"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {searchQuery
                                            ? "Coba kata kunci lain atau hapus pencarian."
                                            : `Klik "Add New" untuk menambahkan warehouse pertama.`}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredWarehouses.map((w) => (
                                        <div
                                            key={w.id}
                                            className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {w.foto ? (
                                                        <img
                                                            src={w.foto}
                                                            alt={w.nama}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <WarehouseIcon className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                                        {w.nama}
                                                    </p>
                                                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {w.alamat || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 shrink-0">
                                                <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Boxes className="w-4 h-4 text-slate-400" />
                                                    {w.produk_count ?? 0} Products
                                                </div>
                                                <button
                                                    onClick={() => openWarehouseDetail(w)}
                                                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                                                >
                                                    Details
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openEditWarehouse(w, "list")}
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
                    )}

                    {view === "detail" && activeWarehouse && (
                        <>
                            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {activeWarehouse.foto ? (
                                            <img
                                                src={activeWarehouse.foto}
                                                alt={activeWarehouse.nama}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <WarehouseIcon className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {activeWarehouse.nama}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {activeWarehouse.no_hp || "-"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditWarehouse(activeWarehouse, "detail")}
                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition shrink-0"
                                >
                                    Edit Warehouse
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Package2 className="w-4 h-4 text-blue-700" />
                                        <p className="text-base font-semibold text-slate-800">
                                            {/* ✅ Angka dan label berubah saat search aktif */}
                                            <span className="text-blue-700">
                                                {filteredWarehouseProducts.length}
                                            </span>{" "}
                                            {productSearchQuery
                                                ? `hasil untuk "${productSearchQuery}"`
                                                : "Total Products"}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        View and update your Product Warehouse list here.
                                    </p>
                                </div>
                                <button
                                    onClick={openAssignForm}
                                    className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-full transition shrink-0"
                                >
                                    Assign a Products
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-sm font-semibold text-slate-800 mb-3">
                                {productSearchQuery ? "Hasil Pencarian" : "All Products"}
                            </p>

                            {loadingWarehouseProducts ? (
                                <div className="bg-white rounded-xl border border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
                                    Memuat produk...
                                </div>
                            ) : filteredWarehouseProducts.length === 0 ? (
                                <div className="bg-white rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
                                    <Package2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-slate-500">
                                        {productSearchQuery
                                            ? `Tidak ada produk dengan kata kunci "${productSearchQuery}"`
                                            : "Belum ada produk di warehouse ini"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {productSearchQuery
                                            ? "Coba kata kunci lain atau hapus pencarian."
                                            : `Klik "Assign a Products" untuk menambahkan produk.`}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredWarehouseProducts.map((sg) => (
                                        <div
                                            key={sg.id}
                                            className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-11 h-11 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {sg.produk?.thumbnail ? (
                                                        <img
                                                            src={sg.produk.thumbnail}
                                                            alt={sg.produk.nama}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Package2 className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                                        {sg.produk?.nama ?? "-"}
                                                    </p>
                                                    <p className="text-xs text-blue-600 font-semibold truncate">
                                                        Rp {Number(sg.produk?.harga ?? 0).toLocaleString("id-ID")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
                                                <Boxes className="w-4 h-4 text-slate-400" />
                                                {sg.stok} Stock
                                            </div>

                                            <div className="hidden lg:block text-sm text-slate-500 truncate max-w-[140px] shrink-0">
                                                {sg.produk?.kategori?.name ?? "-"}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => openDetailModal(sg)}
                                                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                                                >
                                                    Details
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openStockModal(sg)}
                                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition"
                                                >
                                                    Add Stock
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {view === "warehouse-form" && (
                        <form
                            onSubmit={submitWarehouse}
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
                                        aria-label="Upload warehouse photo"
                                    >
                                        {displayedPhoto ? (
                                            <img
                                                src={displayedPhoto}
                                                alt="Warehouse preview"
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
                                        Foto "{selectedFile.name}" akan diupload saat kamu klik Save Warehouse
                                    </p>
                                )}

                                <div className="space-y-5 mb-10">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                        <WarehouseIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                        <input
                                            id="w-nama"
                                            name="nama"
                                            type="text"
                                            value={warehouseForm.nama}
                                            onChange={handleWarehouseFormChange}
                                            placeholder="Warehouse Name"
                                            required
                                            className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                        <input
                                            id="w-no_hp"
                                            name="no_hp"
                                            type="text"
                                            value={warehouseForm.no_hp}
                                            onChange={handleWarehouseFormChange}
                                            placeholder="Phone Number"
                                            className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                        />
                                    </div>

                                    <div className="flex items-start gap-3 border-b border-slate-200 pb-2.5">
                                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                        <textarea
                                            id="w-alamat"
                                            name="alamat"
                                            rows={3}
                                            value={warehouseForm.alamat}
                                            onChange={handleWarehouseFormChange}
                                            placeholder="Warehouse Address"
                                            required
                                            className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeWarehouseForm}
                                        disabled={submittingWarehouse}
                                        className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingWarehouse}
                                        className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                                    >
                                        {submittingWarehouse ? "Menyimpan..." : "Save Warehouse"}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <p className="text-sm font-semibold text-slate-800 mb-3">
                                    Quick Guide to Adding Warehouse
                                </p>
                                <ul className="space-y-3">
                                    {warehouseTips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-500 leading-relaxed">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </form>
                    )}

                    {view === "product-form" && activeWarehouse && (
                        <form
                            onSubmit={submitAssignProduct}
                            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
                        >
                            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-sm font-semibold text-slate-800 mb-6">
                                    Complete The Form
                                </h2>

                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {selectedProduk?.thumbnail ? (
                                            <img
                                                src={selectedProduk.thumbnail}
                                                alt={selectedProduk.nama}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Smartphone className="w-5 h-5 text-slate-300" />
                                        )}
                                    </div>
                                    {selectedProduk && (
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedProduk.nama}
                                            </p>
                                            <p className="text-xs text-blue-600 font-semibold">
                                                Rp {Number(selectedProduk.harga).toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5 mb-10">
                                    <label className="flex items-center gap-3 border-b border-slate-200 pb-2.5 cursor-pointer">
                                        <Package2 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-slate-400">Pilih Produk</p>
                                            <select
                                                value={selectedProdukId}
                                                onChange={(e) => setSelectedProdukId(e.target.value)}
                                                required
                                                disabled={loadingProduk}
                                                className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none appearance-none"
                                            >
                                                <option value="" disabled>
                                                    {loadingProduk ? "Memuat produk..." : "Pilih produk"}
                                                </option>
                                                {produkList.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nama}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                    </label>

                                    {!loadingProduk && produkList.length === 0 && (
                                        <p className="text-xs text-rose-500">
                                            Belum ada produk terdaftar. Tambahkan produk dulu di menu Produk
                                            sebelum assign ke gudang.
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                        <Tags className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-slate-400">Kategori</p>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedProduk?.kategori?.name ?? "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                        <Boxes className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-slate-400">Stok Awal</p>
                                            <input
                                                type="number"
                                                min={0}
                                                value={assignStock}
                                                onChange={(e) => setAssignStock(e.target.value)}
                                                placeholder="0"
                                                required
                                                className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeProductForm}
                                        disabled={submittingAssign}
                                        className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedProduk || submittingAssign}
                                        className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingAssign ? "Menyimpan..." : "Assign Product"}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <p className="text-sm font-semibold text-slate-800 mb-3">
                                    Quick Guide to Assigning Products
                                </p>
                                <ul className="space-y-3">
                                    {productTips.map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-xs text-slate-500 leading-relaxed">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </form>
                    )}
                </main>
            </div>

            {/* Product details popup */}
            {detailProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
                    onClick={closeDetailModal}
                >
                    <div
                        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Product Details</h2>
                            <button
                                type="button"
                                onClick={closeDetailModal}
                                aria-label="Close"
                                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                                            <Package2 className="w-3.5 h-3.5 text-slate-500" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {detailProduct.produk?.nama ?? "-"}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {detailProduct.produk?.kategori?.name ?? "-"}
                                    </p>
                                    <p className="text-lg font-bold text-blue-600 mt-1">
                                        Rp {Number(detailProduct.produk?.harga ?? 0).toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                    {detailProduct.produk?.thumbnail ? (
                                        <img
                                            src={detailProduct.produk.thumbnail}
                                            alt={detailProduct.produk.nama}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package2 className="w-6 h-6 text-slate-300" />
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 mt-4 pt-4 space-y-3.5">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Boxes className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Stock</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {detailProduct.stok} unit
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <WarehouseIcon className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Warehouse</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {activeWarehouse?.nama}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add stock modal */}
            {stockTargetId !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
                    onClick={closeStockModal}
                >
                    <form
                        onSubmit={submitStock}
                        className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Add Stock</h2>
                            <button
                                type="button"
                                onClick={closeStockModal}
                                aria-label="Close"
                                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Jumlah Tambahan Stock
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={stockAmount}
                            onChange={(e) => setStockAmount(e.target.value)}
                            placeholder="0"
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />

                        <div className="flex items-center gap-3 pt-5">
                            <button
                                type="button"
                                onClick={closeStockModal}
                                disabled={submittingStock}
                                className="flex-1 border border-slate-300 text-slate-600 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submittingStock}
                                className="flex-1 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                            >
                                {submittingStock ? "Menyimpan..." : "Tambah"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}