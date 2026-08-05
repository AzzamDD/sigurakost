import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    UserRound,
    ShoppingBag,
    Building2,
    CalendarClock,

} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

type DashboardStats = {
    total_user: number;
    total_order: number;
    total_merchant: number;
    total_produk: number;
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

    const menuItems = [
        { label: "Beranda", icon: Home, path: "/dashboard", active: true },
        { label: "Produk", icon: Package, path: "/produk" },
        { label: "Kategori", icon: Tags, path: "/kategori" },
        { label: "Warehouse", icon: Warehouse, path: "/warehouse" },
        { label: "Merchant", icon: Store, path: "/merchant" },
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

                    {/* Latest transaction — kosong karena menu transaksi belum ada */}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-slate-800">
                            Latest Transaction
                        </h2>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {/* Table header */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide bg-slate-50">
                                        <th className="px-5 py-3 font-medium">Product Name</th>
                                        <th className="px-5 py-3 font-medium">Date</th>
                                        <th className="px-5 py-3 font-medium">Qty</th>
                                        <th className="px-5 py-3 font-medium">Total Price</th>
                                        <th className="px-5 py-3 font-medium">Kategori</th>
                                        <th className="px-5 py-3 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Kosong — transaksi belum punya menu/endpoint */}
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingBag className="w-8 h-8 text-slate-200" />
                                                <p className="text-sm font-medium text-slate-400">
                                                    Belum ada transaksi
                                                </p>
                                                <p className="text-xs text-slate-300">
                                                    Data transaksi akan muncul di sini setelah tersedia
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Grand total — kosong */}
                        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100">
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-500">Grand Total:</span>
                            <span className="text-sm font-semibold text-blue-700">
                                Rp 0
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}