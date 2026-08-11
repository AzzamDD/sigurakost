import { useState, useEffect } from "react";
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
    UserRound,
    ShoppingBag,
    Building2,
    Receipt,


} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

type DashboardStats = {
    total_user: number;
    total_order: number;
    total_merchant: number;
    total_produk: number;
};

// Tambahkan di bagian type definitions
type LatestTransaksi = {
    id: number;
    nama_pelanggan: string | null;
    total_bayar: number;
    toko?: { id: number; nama: string };
    pengguna?: { id: number; nama: string };
    detail_transaksi?: {
        id: number;
        jumlah: number;
        sub_total: number;
        produk?: {
            nama: string;
            kategori?: { name: string };
        };
    }[];
};

export default function Dashboard() {
    const { user } = useUser();
    const navigate = useNavigate();

    const [stats, setStats] = useState<DashboardStats>({
        total_user: 0,
        total_order: 0,
        total_merchant: 0,
        total_produk: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [latestTrx, setLatestTrx] = useState<LatestTransaksi[]>([]);
    const [loadingTrx, setLoadingTrx] = useState(true);
    const [selectedTrx, setSelectedTrx] = useState<LatestTransaksi | null>(null);

    const fetchLatestTransactions = async () => {
        setLoadingTrx(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/dashboard/latest-transactions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (res.ok) setLatestTrx(await res.json());
        } catch { /* silent */ } finally {
            setLoadingTrx(false);
        }
    };

    // Update useEffect yang sudah ada
    useEffect(() => {
        fetchStats();
        fetchLatestTransactions();
    }, []);

    const menuItems = [
        { label: "Beranda", icon: Home, path: "/dashboard", active: true },
        { label: "Produk", icon: Package, path: "/produk", active: false },
        { label: "Kategori", icon: Tags, path: "/kategori", active: false },
        { label: "Warehouse", icon: WarehouseIcon, path: "/warehouse", active: false },
        { label: "Merchant", icon: Store, path: "/merchant", active: false },
        { label: "Transaksi", icon: Receipt, path: "/transaksi", active: false },
    ];

    const accountItems = [
        { label: "Roles", icon: ShieldCheck, path: "/role" },
        { label: "Manajemen User", icon: Users, path: "/manageUser" },
        { label: "Settings", icon: Settings, path: "/settings" },
    ];

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/dashboard/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch {
            // gagal fetch — biarkan nilai tetap 0
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const statCards = [
        {
            label: "Total User",
            value: stats.total_user,
            icon: UserRound,
            iconBg: "bg-indigo-100",
            iconColor: "text-indigo-500",
        },
        {
            label: "Total Order",
            value: stats.total_order,
            icon: ShoppingBag,
            iconBg: "bg-amber-100",
            iconColor: "text-amber-500",
        },
        {
            label: "Total Merchant",
            value: stats.total_merchant,
            icon: Building2,
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-500",
        },
        {
            label: "Total Produk",
            value: stats.total_produk,
            icon: Package,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-500",
        },
    ];
    return (
        <div className="min-h-screen w-full bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 px-6 py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 35" width="90" height="35" role="img" aria-label="sentra logo dark">
                        <defs>
                            <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0" stop-color="#818CF8" />
                                <stop offset="1" stop-color="#22D3EE" />
                            </linearGradient>
                        </defs>

                        <rect x="0" y="0" width="90" height="35" rx="16" fill="#0B1220" />

                        <g transform="translate(20,10) scale(1.2)">
                            <g stroke="url(#brand)" stroke-width="4.5" stroke-linecap="round">
                                <line x1="50" y1="50" x2="22" y2="22" />
                                <line x1="50" y1="50" x2="78" y2="22" />
                                <line x1="50" y1="50" x2="22" y2="78" />
                                <line x1="50" y1="50" x2="78" y2="78" />
                            </g>
                            <g fill="url(#brand)">
                                <circle cx="22" cy="22" r="8" />
                                <circle cx="78" cy="22" r="8" />
                                <circle cx="22" cy="78" r="8" />
                                <circle cx="78" cy="78" r="8" />
                            </g>
                            <rect x="37" y="37" width="26" height="26" rx="8" fill="url(#brand)" />
                            <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
                                font-family="'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif"
                                font-size="20" font-weight="700" fill="#0B1220">S</text>
                        </g>

                        <text x="160" y="84" text-anchor="start"
                            font-family="'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif"
                            font-size="52" font-weight="600" letter-spacing="1" fill="#F8FAFC">sentra</text>
                    </svg>
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

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="flex items-center justify-between gap-4 px-8 py-5">
                    <h1 className="text-lg font-semibold text-slate-800">Beranda</h1>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
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
                <div className="flex-1 px-8 pb-8 overflow-y-auto">
                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statCards.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
                            <div
                                key={label}
                                className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {loadingStats ? (
                                            <span className="inline-block w-10 h-7 bg-slate-100 rounded animate-pulse" />
                                        ) : (
                                            value.toLocaleString("id-ID")
                                        )}
                                    </p>
                                </div>
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${iconBg}`}>
                                    <Icon className={`w-5 h-5 ${iconColor}`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Latest Transactions */}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-slate-800">
                            Latest Transaction
                        </h2>
                        <button
                            onClick={() => navigate("/transaksi")}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                        >
                            Lihat semua →
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                                        <th className="px-5 py-3 font-medium">ID</th>
                                        <th className="px-5 py-3 font-medium">Pelanggan</th>
                                        <th className="px-5 py-3 font-medium">Toko</th>
                                        <th className="px-5 py-3 font-medium">Kasir</th>
                                        <th className="px-5 py-3 font-medium">Total</th>
                                        <th className="px-5 py-3 font-medium text-right">Detail</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingTrx ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-t border-slate-100">
                                                {Array.from({ length: 6 }).map((__, j) => (
                                                    <td key={j} className="px-5 py-3">
                                                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : latestTrx.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <ShoppingBag className="w-8 h-8 text-slate-200" />
                                                    <p className="text-sm font-medium text-slate-400">
                                                        Belum ada transaksi
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        latestTrx.map((t) => (
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
                                                    Rp {Number(t.total_bayar).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => setSelectedTrx(t)}
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

                        {/* Grand total */}
                        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100">
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">Grand Total:</span>
                            <span className="text-sm font-semibold text-blue-700">
                                Rp{" "}
                                {latestTrx
                                    .reduce((s, t) => s + Number(t.total_bayar), 0)
                                    .toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>

                    {/* Modal detail transaksi dari dashboard */}
                    {selectedTrx && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
                            onClick={() => setSelectedTrx(null)}
                        >
                            <div
                                className="w-full max-w-md bg-white rounded-2xl shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Transaksi #{selectedTrx.id}
                                    </h2>
                                    <button
                                        onClick={() => setSelectedTrx(null)}
                                        className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
                                    >
                                        {/* Import X dari lucide-react */}
                                        <span className="text-lg leading-none">×</span>
                                    </button>
                                </div>

                                <div className="px-6 py-4 space-y-1.5 text-sm">
                                    {[
                                        ["Pelanggan", selectedTrx.nama_pelanggan || "—"],
                                        ["Toko", selectedTrx.toko?.nama ?? "—"],
                                        ["Kasir", selectedTrx.pengguna?.nama ?? "—"],
                                    ].map(([label, value]) => (
                                        <p key={label}>
                                            <span className="text-slate-400 w-24 inline-block">{label}:</span>
                                            <span className="text-slate-700 font-medium">{value}</span>
                                        </p>
                                    ))}
                                </div>

                                <div className="px-6 border-t border-slate-100 pt-3 pb-2 space-y-2">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                                        Item
                                    </p>
                                    {selectedTrx.detail_transaksi?.map((d) => (
                                        <div key={d.id} className="flex justify-between text-sm">
                                            <span className="text-slate-600">
                                                {d.produk?.nama ?? `Produk`}{" "}
                                                <span className="text-slate-400">×{d.jumlah}</span>
                                            </span>
                                            <span className="text-slate-700 font-medium">
                                                Rp {Number(d.sub_total).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-6 border-t border-slate-100 pt-3 pb-5 text-right">
                                    <p className="text-base font-bold text-slate-800">
                                        Total: Rp {Number(selectedTrx.total_bayar).toLocaleString("id-ID")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}