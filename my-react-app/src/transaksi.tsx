import { type FormEvent, useEffect, useState } from "react";
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
    Trash2,
    X,
    ChevronDown,
    Receipt,
    ShoppingCart,
    Minus,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

/* ---------- Types ---------- */
type TokoRef = { id: number; nama: string };
type PenggunaRef = { id: number; nama: string };
type ProdukRef = { id: number; nama: string; harga: number };


type DetailTransaksiItem = {
    id: number;
    produk_id: number;
    jumlah: number;
    harga: number;
    sub_total: number;
    produk?: ProdukRef;
};

type TransaksiItem = {
    id: number;
    nama_pelanggan: string | null;
    no_hp: string | null;
    sub_total: number;
    pajak: number;
    total_bayar: number;
    toko_id: number;
    pengguna_id: number | null;
    toko?: TokoRef;
    pengguna?: PenggunaRef;
    detail_transaksi?: DetailTransaksiItem[];
};

type PaginatedResponse = {
    data: TransaksiItem[];
    current_page: number;
    last_page: number;
    total: number;
};

type CartItem = {
    produk_id: number;
    nama: string;
    harga: number;
    jumlah: number;
};

type ViewMode = "list" | "add";

export default function TransactionPage() {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();

    const role = user?.role?.nama?.trim().toLowerCase() ?? null;
    const isAdmin = role === "admin";

    const [view, setView] = useState<ViewMode>("list");
    const [transaksiList, setTransaksiList] = useState<TransaksiItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedTransaksi, setSelectedTransaksi] = useState<TransaksiItem | null>(null);

    const [tokoList, setTokoList] = useState<TokoRef[]>([]);
    const [filterTokoId, setFilterTokoId] = useState<string>("");

    const [produkList, setProdukList] = useState<ProdukRef[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProdukId, setSelectedProdukId] = useState("");
    const [jumlahInput, setJumlahInput] = useState("1");

    const [namaPelanggan, setNamaPelanggan] = useState("");
    const [noHp, setNoHp] = useState("");
    const [pajak, setPajak] = useState("0");
    const [adminTokoId, setAdminTokoId] = useState(""); // toko_id kalau admin bikin transaksi

    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const menuItems = [
        { label: "Beranda", icon: Home, path: "/dashboard" },
        { label: "Produk", icon: Package, path: "/produk" },
        { label: "Kategori", icon: Tags, path: "/kategori" },
        { label: "Warehouse", icon: WarehouseIcon, path: "/warehouse" },
        { label: "Merchant", icon: Store, path: "/merchant" },
        { label: "Transaksi", icon: Receipt, path: "/transaksi", active: true },
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

    /* ---------- Fetch ---------- */
    const fetchTransaksi = async () => {
        setLoadingList(true);
        try {
            const params = new URLSearchParams();
            if (isAdmin && filterTokoId) params.set("toko_id", filterTokoId);

            const res = await fetch(`${API_URL}/transaksi?${params.toString()}`, {
                headers: authHeaders(),
            });
            if (res.ok) {
                const data: PaginatedResponse = await res.json();
                setTransaksiList(data.data);
            }
        } finally {
            setLoadingList(false);
        }
    };

    const fetchToko = async () => {
        const res = await fetch(`${API_URL}/toko`, { headers: authHeaders() });
        if (res.ok) setTokoList(await res.json());
    };

    const fetchProduk = async () => {
        const res = await fetch(`${API_URL}/produk`, { headers: authHeaders() });
        if (res.ok) setProdukList(await res.json());
    };

    useEffect(() => {
        if (userLoading || !role) return; // tunggu role kebaca dulu, jangan tembak API buta
        fetchTransaksi();
        if (isAdmin) fetchToko();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLoading, role, filterTokoId]);

    useEffect(() => {
        if (view === "add") fetchProduk();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    /* ---------- Cart ---------- */
    const addToCart = () => {
        if (!selectedProdukId) return;
        const produk = produkList.find((p) => p.id === Number(selectedProdukId));
        if (!produk) return;

        const jumlah = Number(jumlahInput) || 1;

        setCart((prev) => {
            const existing = prev.find((c) => c.produk_id === produk.id);
            if (existing) {
                return prev.map((c) =>
                    c.produk_id === produk.id ? { ...c, jumlah: c.jumlah + jumlah } : c
                );
            }
            return [...prev, { produk_id: produk.id, nama: produk.nama, harga: produk.harga, jumlah }];
        });

        setSelectedProdukId("");
        setJumlahInput("1");
    };

    const updateCartJumlah = (produkId: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) =>
                    c.produk_id === produkId ? { ...c, jumlah: Math.max(1, c.jumlah + delta) } : c
                )
                .filter((c) => c.jumlah > 0)
        );
    };

    const removeFromCart = (produkId: number) => {
        setCart((prev) => prev.filter((c) => c.produk_id !== produkId));
    };

    const cartSubTotal = cart.reduce((sum, c) => sum + c.harga * c.jumlah, 0);
    const totalBayar = cartSubTotal + (Number(pajak) || 0);

    /* ---------- Submit ---------- */
    const resetForm = () => {
        setCart([]);
        setNamaPelanggan("");
        setNoHp("");
        setPajak("0");
        setAdminTokoId("");
        setSelectedProdukId("");
        setJumlahInput("1");
    };

    const openAddPage = () => {
        resetForm();
        setView("add");
    };

    const closeAddPage = () => {
        resetForm();
        setView("list");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert("Keranjang masih kosong. Tambahkan minimal 1 produk.");
            return;
        }
        if (isAdmin && !adminTokoId) {
            alert("Pilih toko dulu.");
            return;
        }

        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                nama_pelanggan: namaPelanggan || null,
                no_hp: noHp || null,
                pajak: Number(pajak) || 0,
                items: cart.map((c) => ({ produk_id: c.produk_id, jumlah: c.jumlah })),
            };
            if (isAdmin) payload.toko_id = Number(adminTokoId);

            const res = await fetch(`${API_URL}/transaksi`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    alert(Array.isArray(firstError) ? firstError[0] : data.message);
                } else {
                    alert(data.message || "Gagal membuat transaksi");
                }
                return;
            }

            await fetchTransaksi();
            closeAddPage();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVoid = async (t: TransaksiItem) => {
        if (!confirm(`Batalkan transaksi #${t.id}? Stok akan dikembalikan.`)) return;

        try {
            const res = await fetch(`${API_URL}/transaksi/${t.id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal membatalkan transaksi");
                return;
            }

            await fetchTransaksi();
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    };

    const filteredTransaksi = transaksiList.filter((t) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            (t.nama_pelanggan ?? "").toLowerCase().includes(q) ||
            String(t.id).includes(q) ||
            (t.toko?.nama ?? "").toLowerCase().includes(q)
        );
    });

    // Jangan render apapun yang butuh role sebelum role kebaca — cegah flash UI salah
    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400">
                Memuat...
            </div>
        );
    }

    if (!role) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
                Akun ini belum punya role. Hubungi admin untuk mengatur akses.
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-6 py-6">
                    <img src="/assets/sigurakost.png" alt="logo" className="w-6 h-6 object-contain" />
                    <span className="text-lg font-extrabold text-blue-700 tracking-tight">SiguraKost</span>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto">
                    <p className="px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Menu</p>
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

                    {isAdmin && (
                        <>
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
                        </>
                    )}
                </nav>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between gap-4 px-8 py-5">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-800">
                            {view === "list" ? "Transaksi" : "Buat Transaksi Baru"}
                        </h1>
                        {view === "add" && (
                            <button
                                onClick={closeAddPage}
                                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 transition"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Daftar Transaksi
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        {view === "list" && (
                            <div className="relative w-full max-w-xs hidden sm:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari transaksi..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <img
                                src={user?.foto || "/assets/wong.jpg"}
                                alt="avatar"
                                className="w-9 h-9 rounded-full object-cover bg-slate-200"
                            />
                            <div className="hidden md:block leading-tight">
                                <p className="text-sm font-semibold text-slate-800">{user?.nama}</p>
                                <p className="text-xs text-slate-400 capitalize">{role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-8 pb-8 overflow-y-auto">
                    {view === "list" ? (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
                                <p className="text-base font-semibold text-slate-800">
                                    <span className="text-blue-700">{filteredTransaksi.length}</span> Total Transaksi
                                </p>

                                <div className="flex items-center gap-3">
                                    {isAdmin && (
                                        <div className="relative">
                                            <select
                                                value={filterTokoId}
                                                onChange={(e) => setFilterTokoId(e.target.value)}
                                                className="appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-9 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Semua Toko</option>
                                                {tokoList.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.nama}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    )}

                                    <button
                                        onClick={openAddPage}
                                        className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-full transition"
                                    >
                                        Buat Transaksi
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                                            <th className="px-5 py-3 font-medium">ID</th>
                                            <th className="px-5 py-3 font-medium">Pelanggan</th>
                                            {isAdmin && <th className="px-5 py-3 font-medium">Toko</th>}
                                            <th className="px-5 py-3 font-medium">Kasir</th>
                                            <th className="px-5 py-3 font-medium">Total</th>
                                            <th className="px-5 py-3 font-medium">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingList ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                                    Memuat...
                                                </td>
                                            </tr>
                                        ) : filteredTransaksi.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                                                    Belum ada transaksi
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTransaksi.map((t) => (
                                                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                                                    <td className="px-5 py-3 font-medium text-slate-700">#{t.id}</td>
                                                    <td className="px-5 py-3 text-slate-600">{t.nama_pelanggan || "-"}</td>
                                                    {isAdmin && (
                                                        <td className="px-5 py-3 text-slate-500">{t.toko?.nama ?? "-"}</td>
                                                    )}
                                                    <td className="px-5 py-3 text-slate-500">{t.pengguna?.nama ?? "-"}</td>
                                                    <td className="px-5 py-3 font-semibold text-slate-700">
                                                        Rp {Number(t.total_bayar).toLocaleString("id-ID")}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setSelectedTransaksi(t)}
                                                                className="inline-flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                                                            >
                                                                Detail
                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                            </button>
                                                            {isAdmin && (
                                                                <button
                                                                    onClick={() => handleVoid(t)}
                                                                    className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium px-3 py-1.5 rounded-full transition"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    Void
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* Kiri: pilih produk + info pelanggan */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                    <p className="text-sm font-semibold text-slate-800 mb-4">Info Pelanggan</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Nama pelanggan (opsional)"
                                            value={namaPelanggan}
                                            onChange={(e) => setNamaPelanggan(e.target.value)}
                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="No HP (opsional)"
                                            value={noHp}
                                            onChange={(e) => setNoHp(e.target.value)}
                                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {isAdmin && (
                                        <div className="mt-3">
                                            <label className="text-xs text-slate-400 mb-1 block">Toko</label>
                                            <select
                                                value={adminTokoId}
                                                onChange={(e) => setAdminTokoId(e.target.value)}
                                                required
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="" disabled>
                                                    Pilih toko
                                                </option>
                                                {tokoList.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.nama}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                    <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" /> Tambah Produk
                                    </p>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedProdukId}
                                            onChange={(e) => setSelectedProdukId(e.target.value)}
                                            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih produk</option>
                                            {produkList.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nama} — Rp {Number(p.harga).toLocaleString("id-ID")}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min={1}
                                            value={jumlahInput}
                                            onChange={(e) => setJumlahInput(e.target.value)}
                                            className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={addToCart}
                                            className="bg-slate-900 hover:bg-black text-white px-4 rounded-xl text-sm font-semibold transition"
                                        >
                                            Tambah
                                        </button>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {cart.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-6">Keranjang kosong</p>
                                        ) : (
                                            cart.map((c) => (
                                                <div
                                                    key={c.produk_id}
                                                    className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-2.5"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 truncate">{c.nama}</p>
                                                        <p className="text-xs text-slate-400">
                                                            Rp {c.harga.toLocaleString("id-ID")} / item
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCartJumlah(c.produk_id, -1)}
                                                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="text-sm w-6 text-center">{c.jumlah}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCartJumlah(c.produk_id, 1)}
                                                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(c.produk_id)}
                                                            className="text-rose-500 hover:text-rose-700 ml-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Kanan: ringkasan */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit space-y-4">
                                <p className="text-sm font-semibold text-slate-800">Ringkasan</p>
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Pajak (nominal, opsional)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={pajak}
                                        onChange={(e) => setPajak(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>Rp {cartSubTotal.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Pajak</span>
                                        <span>Rp {(Number(pajak) || 0).toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-slate-800 text-base pt-1">
                                        <span>Total</span>
                                        <span>Rp {totalBayar.toLocaleString("id-ID")}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-full transition disabled:opacity-50"
                                >
                                    {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>

            {/* Modal Detail */}
            {selectedTransaksi && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
                    onClick={() => setSelectedTransaksi(null)}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Transaksi #{selectedTransaksi.id}</h2>
                            <button
                                onClick={() => setSelectedTransaksi(null)}
                                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1 text-sm mb-4">
                            <p>
                                <span className="text-slate-400">Pelanggan:</span>{" "}
                                {selectedTransaksi.nama_pelanggan || "-"}
                            </p>
                            <p>
                                <span className="text-slate-400">Toko:</span> {selectedTransaksi.toko?.nama ?? "-"}
                            </p>
                            <p>
                                <span className="text-slate-400">Kasir:</span>{" "}
                                {selectedTransaksi.pengguna?.nama ?? "-"}
                            </p>
                        </div>

                        <div className="border-t border-slate-100 pt-3 space-y-2">
                            {selectedTransaksi.detail_transaksi?.map((d) => (
                                <div key={d.id} className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        {d.produk?.nama ?? `Produk #${d.produk_id}`} x{d.jumlah}
                                    </span>
                                    <span className="text-slate-700 font-medium">
                                        Rp {Number(d.sub_total).toLocaleString("id-ID")}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-100 mt-3 pt-3 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span>Rp {Number(selectedTransaksi.sub_total).toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Pajak</span>
                                <span>Rp {Number(selectedTransaksi.pajak).toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800">
                                <span>Total</span>
                                <span>Rp {Number(selectedTransaksi.total_bayar).toLocaleString("id-ID")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}