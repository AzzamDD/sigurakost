import { type ChangeEvent, type FormEvent, useRef, useState, useEffect } from "react";
import { useUser } from "./context/UserContext";
import { useNavigate } from "react-router-dom";
import {
    Home,
    Package,
    Tags,
    Warehouse as WarehouseIcon,
    Store,
    ShieldCheck,
    Users,
    Settings as SettingsIcon,
    LogOut,
    Search,
    Receipt,
    User,
    Mail,
    Phone,
    Lock,
    ImagePlus,
} from "lucide-react";

type ProfileForm = {
    name: string;
    email: string;
    phone: string;
    photo: string | null;
};

type PasswordForm = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
};

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { user, setUser, refreshUser } = useUser();
    const photoInputRef = useRef<HTMLInputElement>(null);

    const [profileForm, setProfileForm] = useState<ProfileForm>({
        name: "",
        email: "",
        phone: "",
        photo: null,
    });

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/");
            return;
        }
        if (user) {
            setProfileForm({
                name: user.nama,
                email: user.email,
                phone: user.no_hp ?? "",
                photo: user.foto,
            });
        }
    }, [user, navigate]);

    const [passwordForm, setPasswordForm] = useState<PasswordForm>({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [notifications, setNotifications] = useState({
        email: true,
        inApp: true,
        whatsapp: false,
    });

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
        { label: "Settings", icon: SettingsIcon, path: "/settings", active: true },
    ];

    const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoPick = () => {
        photoInputRef.current?.click();
    };

    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // preview lokal dulu biar responsif
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                setProfileForm((prev) => ({ ...prev, photo: result }));
            }
        };
        reader.readAsDataURL(file);

        // upload beneran ke backend
        setUploadingPhoto(true);
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("photo", file);

        try {
            const res = await fetch(`${API_URL}/profile/photo`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal upload foto");
                return;
            }

            setProfileForm((prev) => ({ ...prev, photo: data.url }));
            refreshUser();
        } catch {
            alert("Tidak dapat terhubung ke server");
        } finally {
            setUploadingPhoto(false);
            e.target.value = "";
        }
    };

    const submitProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_URL}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nama: profileForm.name,
                    email: profileForm.email,
                    no_hp: profileForm.phone,
                    foto: profileForm.photo,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal memperbarui profil");
                return;
            }

            setUser(data.user);
            alert("Profile updated successfully!");
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const submitPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("New password and confirmation do not match!");
            return;
        }

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_URL}/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: passwordForm.oldPassword,
                    new_password: passwordForm.newPassword,
                    new_password_confirmation: passwordForm.confirmPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Gagal mengubah password");
                return;
            }

            alert("Password changed successfully!");
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch {
            alert("Tidak dapat terhubung ke server");
        }
    };

    const handleNotificationToggle = (key: keyof typeof notifications) => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    };


    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch {
            // tetep lanjut clear meskipun request gagal
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

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
                        {accountItems.map(({ label, icon: Icon, path, active }) => (
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
                </nav>


            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="flex items-center justify-between gap-4 px-8 py-5">
                    <h1 className="text-lg font-semibold text-slate-800">Settings</h1>

                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="relative w-full max-w-xs hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

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
                    </div>
                </header>

                {/* Body */}
                <main className="flex-1 px-8 pb-8 overflow-y-auto space-y-6">
                    {/* Profile Information */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-slate-800 mb-5">
                            Profile Information
                        </h2>

                        <form onSubmit={submitProfile} className="space-y-5">
                            <div className="flex items-start gap-5 mb-6">
                                <button
                                    type="button"
                                    onClick={handlePhotoPick}
                                    className="w-20 h-20 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-blue-400 hover:bg-blue-50 transition shrink-0"
                                    aria-label="Upload profile photo"
                                >
                                    {profileForm.photo ? (
                                        <img
                                            src={profileForm.photo}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ImagePlus className="w-6 h-6 text-slate-300" />
                                    )}
                                </button>

                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handlePhotoPick}
                                        disabled={uploadingPhoto}
                                        className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full transition disabled:opacity-50"
                                    >
                                        {uploadingPhoto ? "Uploading..." : profileForm.photo ? "Change Photo" : "Upload Photo"}
                                    </button>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Recommended: JPG or PNG, max 2MB
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        name="name"
                                        type="text"
                                        value={profileForm.name}
                                        onChange={handleProfileChange}
                                        placeholder="Full Name"
                                        required
                                        className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                    />
                                </div>

                                <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={profileForm.email}
                                        onChange={handleProfileChange}
                                        placeholder="Email Address"
                                        required
                                        className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                    />
                                </div>

                                <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5 md:col-span-2">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        name="phone"
                                        type="text"
                                        value={profileForm.phone}
                                        onChange={handleProfileChange}
                                        placeholder="Phone Number"
                                        className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-slate-800 mb-5">
                            Change Password
                        </h2>

                        <form onSubmit={submitPassword} className="space-y-5">
                            <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    name="oldPassword"
                                    type="password"
                                    value={passwordForm.oldPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Current Password"
                                    required
                                    className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    name="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="New Password"
                                    required
                                    className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-3 border-b border-slate-200 pb-2.5">
                                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirm New Password"
                                    required
                                    className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition"
                                >
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Notification Preferences */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-slate-800 mb-5">
                            Notification Preferences
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Mail className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            Email Notifications
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Receive updates via email
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleNotificationToggle("email")}
                                    className={`relative w-11 h-6 rounded-full transition ${notifications.email ? "bg-blue-600" : "bg-slate-300"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications.email ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-slate-800 mb-1">
                            Account
                        </h2>
                        <p className="text-xs text-slate-400 mb-5">
                            Sign out of your Setra account on this device.
                        </p>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
                        >
                            <LogOut className="w-[18px] h-[18px]" />
                            Logout
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}