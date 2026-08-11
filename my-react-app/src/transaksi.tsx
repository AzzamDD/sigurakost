import { type FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./context/UserContext";
import {
    Home, Package, Tags, Warehouse as WarehouseIcon, Store,
    ShieldCheck, Users, Settings as SettingsIcon, Search,
    ChevronRight, ChevronLeft, ChevronDown, Plus, Trash2,
    X, Receipt, ShoppingCart, Minus, AlertCircle,
    ChevronLeft as PagePrev, ChevronRight as PageNext,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

// ✅ Konstanta PPN — ubah di sini kalau tarif berubah
const PPN_RATE = 0.11; // 11%

/* ─────────────────────────── Types ─────────────────────────── */
type TokoRef = { id: number; nama: string };
type PenggunaRef = { id: number; nama: string };
type ProdukRef = { id: number; nama: string; harga: number };
type KategoriRef = { id: number; name: string };

type DetailTransaksiItem = {
    id: number;
    produk_id: number;
    jumlah: number;
    harga: number;
    sub_total: number;
    produk?: ProdukRef & { kategori?: KategoriRef };
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
    per_page: number;
};

type CartItem = {
    produk_id: number;
    nama: string;
    harga: number;
    jumlah: number;
};

type ViewMode = "list" | "add";

/* ─────────────────────────── Component ─────────────────────── */
export default function TransactionPage() {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();

    const role = user?.role?.nama?.trim().toLowerCase() ?? null;
    const isAdmin = role === "admin";

    /* ── State ── */
    const [view, setView] = useState<ViewMode>("list");
    const [transaksiList, setTransaksiList] = useState<TransaksiItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedTransaksi, setSelectedTransaksi] = useState<TransaksiItem | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);

    // Filter & search
    const [tokoList, setTokoList] = useState<TokoRef[]>([]);
    const [filterTokoId, setFilterTokoId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form — add transaksi
    const [produkList, setProdukList] = useState<ProdukRef[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProdukId, setSelectedProdukId] = useState("");
    const [jumlahInput, setJumlahInput] = useState("1");
    const [namaPelanggan, setNamaPelanggan] = useState("");
    const [noHp, setNoHp] = useState("");
    const [adminTokoId, setAdminTokoId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Error state
    const [listError, setListError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    /* ── Kalkulasi pajak otomatis ── */
    const cartSubTotal = cart.reduce((sum, c) => sum + c.harga * c.jumlah, 0);

    // ✅ Pajak dibulatkan ke integer (Math.round) karena kolom DB integer
    const pajakNominal = Math.round(cartSubTotal * PPN_RATE);
    const totalBayar = cartSubTotal + pajakNominal;

    /* ── Sidebar ── */
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
        { label: "Settings", icon: SettingsIcon, path: "/settings" },
    ];

    /* ── Helpers ── */
    const authHeaders = (): Record<string, string> => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
    });

    const fmt = (n: number | string) => Number(n).toLocaleString("id-ID");

    // ✅ Centralized 401 handler
    const handleUnauthorized = (status: number) => {
        if (status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return true;
        }
        return false;
    };

    /* ── Fetch transaksi ── */
    const fetchTransaksi = async (page = 1, search = searchQuery) => {
        setLoadingList(true);
        setListError(null);
        try {
            const params = new URLSearchParams({ page: String(page) });
            if (isAdmin && filterTokoId) params.set("toko_id", filterTokoId);
            if (search.trim()) params.set("search", search.trim());

            const res = await fetch(`${API_URL}/transaksi?${params}`, {
                headers: authHeaders(),
            });
            const data = await res.json();

            if (handleUnauthorized(res.status)) return;

            if (!res.ok) {
                setListError(data.message || "Gagal memuat data transaksi.");
                setTransaksiList([]);
                return;
            }

            const paginated = data as PaginatedResponse;
            setTransaksiList(paginated.data);
            setCurrentPage(paginated.current_page);
            setLastPage(paginated.last_page);
            setTotalRows(paginated.total);
        } catch {
            setListError("Tidak dapat terhubung ke server.");
        } finally {
            setLoadingList(false);
        }
    };

    const fetchToko = async () => {
        try {
            const res = await fetch(`${API_URL}/toko`, { headers: authHeaders() });
            if (res.ok) {
                const json = await res.json();
                // ✅ Handle baik array maupun paginated response
                setTokoList(Array.isArray(json) ? json : (json.data ?? []));
            }
        } catch { /* silent */ }
    };

    const fetchProduk = async () => {
        try {
            const res = await fetch(`${API_URL}/produk`, { headers: authHeaders() });
            if (res.ok) {
                const json = await res.json();
                setProdukList(Array.isArray(json) ? json : (json.data ?? []));
            }
        } catch { /* silent */ }
    };

    /* ── Effects ── */

    // Fetch toko sekali saja saat mount
    useEffect(() => {
        if (userLoading || !role) return;
        fetchToko();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLoading, role]);

    // Fetch transaksi saat filter toko berubah
    useEffect(() => {
        if (userLoading || !role) return;
        fetchTransaksi(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLoading, role, filterTokoId]);

    // Fetch produk hanya saat buka form add
    useEffect(() => {
        if (view === "add") fetchProduk();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    // Cleanup search timeout
    useEffect(() => {
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, []);

    /* ── Search dengan debounce ── */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            fetchTransaksi(1, val);
        }, 400);
    };

    /* ── Cart logic ── */
    const addToCart = () => {
        if (!selectedProdukId) return;
        const produk = produkList.find((p) => p.id === Number(selectedProdukId));
        if (!produk) return;

        const jumlah = Math.max(1, Number(jumlahInput) || 1);
        // ✅ Reset ke "1" kalau input tidak valid
        if (Number(jumlahInput) < 1) setJumlahInput("1");

        setCart((prev) => {
            const existing = prev.find((c) => c.produk_id === produk.id);
            if (existing) {
                return prev.map((c) =>
                    c.produk_id === produk.id
                        ? { ...c, jumlah: c.jumlah + jumlah }
                        : c
                );
            }
            return [
                ...prev,
                { produk_id: produk.id, nama: produk.nama, harga: produk.harga, jumlah },
            ];
        });

        setSelectedProdukId("");
        setJumlahInput("1");
    };

    const updateCartJumlah = (produkId: number, delta: number) => {
        setCart((prev) =>
            prev.map((c) =>
                c.produk_id === produkId
                    ? { ...c, jumlah: Math.max(1, c.jumlah + delta) }
                    : c
            )
        );
    };

    const removeFromCart = (produkId: number) =>
        setCart((prev) => prev.filter((c) => c.produk_id !== produkId));

    /* ── Form ── */
    const resetForm = () => {
        setCart([]);
        setNamaPelanggan("");
        setNoHp("");
        setAdminTokoId("");
        setSelectedProdukId("");
        setJumlahInput("1");
        setFormError(null);
    };

    const openAdd = () => { resetForm(); setView("add"); };
    const closeAdd = () => { resetForm(); setView("list"); };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (cart.length === 0) {
            setFormError("Keranjang masih kosong. Tambahkan minimal 1 produk.");
            return;
        }
        if (isAdmin && !adminTokoId) {
            setFormError("Pilih toko terlebih dahulu.");
            return;
        }

        setSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                nama_pelanggan: namaPelanggan || null,
                no_hp: noHp || null,
                // ✅ Kirim pajak sebagai nominal integer hasil kalkulasi otomatis
                pajak: pajakNominal,
                items: cart.map((c) => ({
                    produk_id: c.produk_id,
                    jumlah: c.jumlah,
                })),
            };
            if (isAdmin) payload.toko_id = Number(adminTokoId);

            const res = await fetch(`${API_URL}/transaksi`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (handleUnauthorized(res.status)) return;

            if (!res.ok) {
                if (data.errors) {
                    const firstErr = Object.values(data.errors)[0];
                    setFormError(Array.isArray(firstErr) ? firstErr[0] as string : data.message);
                } else {
                    setFormError(data.message || "Gagal membuat transaksi.");
                }
                return;
            }

            const savedTransaksi = data as TransaksiItem;
            await fetchTransaksi(1);
            closeAdd();
            printStruk(savedTransaksi);


        } catch {
            setFormError("Tidak dapat terhubung ke server.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVoid = async (t: TransaksiItem) => {
        if (!confirm(`Batalkan transaksi #${t.id}? Stok akan dikembalikan.`)) return;

        // ✅ Tutup modal kalau yang di-void sedang dibuka
        if (selectedTransaksi?.id === t.id) setSelectedTransaksi(null);

        try {
            const res = await fetch(`${API_URL}/transaksi/${t.id}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            const data = await res.json();

            if (handleUnauthorized(res.status)) return;
            if (!res.ok) {
                alert(data.message || "Gagal membatalkan transaksi.");
                return;
            }

            // ✅ Mundur 1 halaman kalau item terakhir di halaman > 1
            const targetPage =
                transaksiList.length === 1 && currentPage > 1
                    ? currentPage - 1
                    : currentPage;
            await fetchTransaksi(targetPage);
        } catch {
            alert("Tidak dapat terhubung ke server.");
        }
    };

    const printStruk = (t: TransaksiItem) => {
        const win = window.open("", "_blank", "width=380,height=600");
        if (!win) {
            alert("Popup diblokir browser. Izinkan popup untuk cetak struk.");
            return;
        }
        const items = t.detail_transaksi ?? [];
        const itemsHtml = items
            .map(
                (d) => `
        <tr>
            <td>${d.produk?.nama ?? `Produk #${d.produk_id}`} x${d.jumlah}</td>
            <td style="text-align:right">Rp ${fmt(d.sub_total)}</td>
        </tr>`
            )
            .join("");

        win.document.write(`
        <html>
        <head>
            <title>Struk #${t.id}</title>
            <style>
                body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 12px; }
                h2 { text-align:center; margin:0 0 4px; }
                p { margin: 2px 0; text-align:center; }
                table { width:100%; border-collapse: collapse; margin-top:8px; }
                td { padding: 2px 0; }
                .line { border-top: 1px dashed #000; margin: 6px 0; }
                .total { font-weight:bold; }
            </style>
        </head>
        <body>
            <h2>Tokoku</h2>
            <p>${t.toko?.nama ?? "-"}</p>
            <p>Kasir: ${t.pengguna?.nama ?? "-"}</p>
            ${t.nama_pelanggan ? `<p>Pelanggan: ${t.nama_pelanggan}</p>` : ""}
            <div class="line"></div>
            <table>${itemsHtml}</table>
            <div class="line"></div>
            <table>
                <tr><td>Subtotal</td><td style="text-align:right">Rp ${fmt(t.sub_total)}</td></tr>
                <tr><td>PPN ${(PPN_RATE * 100).toFixed(0)}%</td><td style="text-align:right">Rp ${fmt(t.pajak)}</td></tr>
                <tr class="total"><td>TOTAL</td><td style="text-align:right">Rp ${fmt(t.total_bayar)}</td></tr>
            </table>
            <div class="line"></div>
            <p>Terima kasih!</p>
        </body>
        </html>
    `);
        win.document.close();
        win.focus();
        setTimeout(() => {
            win.print();
            win.close();
        }, 250);
    };

    /* ─────────────── Guard ─────────────── */
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
                Akun ini belum punya role. Hubungi admin.
            </div>
        );
    }

    /* ─────────────── Render ─────────────── */
    return (
        <div className="min-h-screen w-full bg-slate-100 flex font-sans">

            {/* ══════════ SIDEBAR ══════════ */}
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex-col hidden md:flex">
                <div className="flex items-center gap-2 px-6 py-6">
                    <img
                        src="/assets/sentra.svg"
                        alt="Sentra logo"
                        className="w-6 h-6 object-contain"
                        onError={(e) => (e.currentTarget.style.display = "none")}
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
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active
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

            {/* ══════════ MAIN ══════════ */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header */}
                <header className="flex items-center justify-between gap-4 px-8 py-5 bg-slate-100/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200/50">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-800">
                            {view === "list" ? "Transaksi" : "Buat Transaksi Baru"}
                        </h1>
                        {view === "add" && (
                            <button
                                onClick={closeAdd}
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
                                    placeholder="Cari ID, pelanggan, toko..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
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
                                <p className="text-sm font-semibold text-slate-800">
                                    {user?.nama || "Loading..."}
                                </p>
                                <p className="text-xs text-slate-400 capitalize">{role}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 px-8 pb-8 pt-4 overflow-y-auto">

                    {/* ══════ LIST VIEW ══════ */}
                    {view === "list" && (
                        <div className="max-w-6xl mx-auto">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                                {/* Toolbar */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 flex-wrap">
                                    <p className="text-base font-semibold text-slate-800">
                                        <span className="text-blue-700">{totalRows}</span> Total Transaksi
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {isAdmin && (
                                            <div className="relative">
                                                <select
                                                    value={filterTokoId}
                                                    onChange={(e) => {
                                                        setFilterTokoId(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
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
                                            onClick={openAdd}
                                            className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-full transition"
                                        >
                                            Buat Transaksi
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Error banner */}
                                {listError && (
                                    <div className="flex items-center gap-2 px-5 py-3 bg-rose-50 border-b border-rose-100 text-rose-600 text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {listError}
                                    </div>
                                )}

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                                                <th className="px-5 py-3 font-medium">ID</th>
                                                <th className="px-5 py-3 font-medium">Pelanggan</th>
                                                <th className="px-5 py-3 font-medium">Toko</th>
                                                <th className="px-5 py-3 font-medium">Kasir</th>
                                                <th className="px-5 py-3 font-medium">Total</th>
                                                <th className="px-5 py-3 font-medium">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingList ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <tr key={i} className="border-t border-slate-100">
                                                        {Array.from({ length: 6 }).map((__, j) => (
                                                            <td key={j} className="px-5 py-3">
                                                                <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            ) : transaksiList.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-14 text-center">
                                                        <Receipt className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-400 font-medium">
                                                            Belum ada transaksi
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                transaksiList.map((t) => (
                                                    <tr
                                                        key={t.id}
                                                        className="border-t border-slate-100 hover:bg-slate-50 transition"
                                                    >
                                                        <td className="px-5 py-3 font-medium text-slate-700">
                                                            #{t.id}
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-600">
                                                            {t.nama_pelanggan || (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-500">
                                                            {t.toko?.nama ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-3 text-slate-500">
                                                            {t.pengguna?.nama ?? "—"}
                                                        </td>
                                                        <td className="px-5 py-3 font-semibold text-slate-700">
                                                            Rp {fmt(t.total_bayar)}
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
                                                                <button
                                                                    onClick={() => printStruk(t)}  
                                                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                                                                >
                                                                    <Receipt className="w-3.5 h-3.5" />
                                                                    Cetak Struk
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

                                {/* Pagination */}
                                {!loadingList && !listError && lastPage > 1 && (
                                    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-400">
                                            Halaman {currentPage} dari {lastPage} &middot; {totalRows} transaksi
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                disabled={currentPage <= 1}
                                                onClick={() => fetchTransaksi(currentPage - 1)}
                                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                            >
                                                <PagePrev className="w-4 h-4" />
                                            </button>

                                            {Array.from({ length: lastPage }, (_, i) => i + 1)
                                                .filter((p) =>
                                                    p === 1 ||
                                                    p === lastPage ||
                                                    Math.abs(p - currentPage) <= 1
                                                )
                                                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                                                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                                                        acc.push("...");
                                                    }
                                                    acc.push(p);
                                                    return acc;
                                                }, [])
                                                .map((p, idx) =>
                                                    p === "..." ? (
                                                        <span key={`e-${idx}`} className="px-1 text-slate-300 text-sm">
                                                            …
                                                        </span>
                                                    ) : (
                                                        <button
                                                            key={p}
                                                            onClick={() => fetchTransaksi(p as number)}
                                                            className={`w-8 h-8 rounded-full text-sm font-medium transition ${p === currentPage
                                                                ? "bg-blue-700 text-white"
                                                                : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    )
                                                )}

                                            <button
                                                disabled={currentPage >= lastPage}
                                                onClick={() => fetchTransaksi(currentPage + 1)}
                                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                            >
                                                <PageNext className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══════ ADD VIEW ══════ */}
                    {view === "add" && (
                        <form
                            onSubmit={handleSubmit}

                            className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5"
                        >
                            {/* Kiri */}
                            <div className="lg:col-span-2 space-y-4">

                                {/* Info Pelanggan */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-800 mb-4">
                                        Info Pelanggan
                                    </p>
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
                                            <label className="text-xs text-slate-400 mb-1 block">
                                                Toko <span className="text-rose-400">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={adminTokoId}
                                                    onChange={(e) => setAdminTokoId(e.target.value)}
                                                    required
                                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="" disabled>Pilih toko</option>
                                                    {tokoList.map((t) => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.nama}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute inset-y-0 right-4 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tambah Produk */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <p className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" /> Tambah Produk
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <select
                                                value={selectedProdukId}
                                                onChange={(e) => setSelectedProdukId(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih produk</option>
                                                {produkList.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nama} — Rp {fmt(p.harga)}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute inset-y-0 right-3 my-auto w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
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

                                    {/* Cart items */}
                                    <div className="mt-4 space-y-2">
                                        {cart.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-6">
                                                Keranjang kosong
                                            </p>
                                        ) : (
                                            cart.map((c) => (
                                                <div
                                                    key={c.produk_id}
                                                    className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-2.5"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 truncate">
                                                            {c.nama}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Rp {fmt(c.harga)} / item &middot; Subtotal: Rp{" "}
                                                            {fmt(c.harga * c.jumlah)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCartJumlah(c.produk_id, -1)}
                                                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="text-sm w-6 text-center font-medium">
                                                            {c.jumlah}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCartJumlah(c.produk_id, 1)}
                                                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(c.produk_id)}
                                                            className="text-rose-500 hover:text-rose-700 ml-1 transition"
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

                            {/* Kanan — Ringkasan */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 h-fit space-y-4 shadow-sm">
                                <p className="text-sm font-semibold text-slate-800">Ringkasan</p>

                                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>Rp {fmt(cartSubTotal)}</span>
                                    </div>

                                    {/* ✅ Pajak otomatis — tidak bisa diubah */}
                                    <div className="flex justify-between text-slate-500">
                                        <span className="flex items-center gap-1">
                                            PPN
                                            {/* ✅ Badge persentase */}
                                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-400 rounded-full px-1.5 py-0.5">
                                                {(PPN_RATE * 100).toFixed(0)}%
                                            </span>
                                        </span>
                                        <span>Rp {fmt(pajakNominal)}</span>
                                    </div>

                                    <div className="flex justify-between font-bold text-slate-800 text-base pt-1 border-t border-slate-100">
                                        <span>Total</span>
                                        <span>Rp {fmt(totalBayar)}</span>
                                    </div>
                                </div>

                                {/* Form error banner */}
                                {formError && (
                                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-rose-600 text-xs">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        {formError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || cart.length === 0}
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeAdd}
                                    disabled={submitting}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-semibold py-3 rounded-full transition disabled:opacity-50 text-sm"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>

            {/* ══════════ MODAL DETAIL ══════════ */}
            {selectedTransaksi && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                    onClick={() => setSelectedTransaksi(null)}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                Transaksi #{selectedTransaksi.id}
                            </h2>
                            <button
                                onClick={() => setSelectedTransaksi(null)}
                                className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Info */}
                        <div className="px-6 py-4 space-y-1.5 text-sm">
                            {[
                                ["Pelanggan", selectedTransaksi.nama_pelanggan || "—"],
                                ["No HP", selectedTransaksi.no_hp || "—"],
                                ["Toko", selectedTransaksi.toko?.nama ?? "—"],
                                ["Kasir", selectedTransaksi.pengguna?.nama ?? "—"],
                            ].map(([label, value]) => (
                                <p key={label}>
                                    <span className="text-slate-400 w-24 inline-block">{label}:</span>
                                    <span className="text-slate-700 font-medium">{value}</span>
                                </p>
                            ))}
                        </div>

                        {/* Items */}
                        <div className="px-6 border-t border-slate-100 pt-3 pb-2 space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                Item
                            </p>
                            {selectedTransaksi.detail_transaksi?.map((d) => (
                                <div key={d.id} className="flex justify-between text-sm">
                                    <span className="text-slate-600">
                                        {d.produk?.nama ?? `Produk #${d.produk_id}`}{" "}
                                        <span className="text-slate-400">×{d.jumlah}</span>
                                    </span>
                                    <span className="text-slate-700 font-medium">
                                        Rp {fmt(d.sub_total)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="px-6 border-t border-slate-100 pt-3 pb-5 space-y-1 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span>Rp {fmt(selectedTransaksi.sub_total)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                {/* ✅ Tampilkan label PPN di modal juga */}
                                <span className="flex items-center gap-1">
                                    PPN
                                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-400 rounded-full px-1.5 py-0.5">
                                        {(PPN_RATE * 100).toFixed(0)}%
                                    </span>
                                </span>
                                <span>Rp {fmt(selectedTransaksi.pajak)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800 text-base pt-1 border-t border-slate-100">
                                <span>Total</span>
                                <span>Rp {fmt(selectedTransaksi.total_bayar)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}