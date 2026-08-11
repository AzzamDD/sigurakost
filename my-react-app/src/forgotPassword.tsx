import { type ChangeEvent, type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (error) setError("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email.trim()) {
            setError("Email tidak boleh kosong");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Format email tidak valid");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${API_URL}/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                // 422 = validasi gagal, selain itu = error server
                setError(data.message || "Terjadi kesalahan, coba lagi");
                return;
            }

            // Backend sengaja selalu return sukses walau email gak
            // terdaftar (proteksi enumeration attack), jadi di sini
            // kita anggap submitted tanpa nge-judge valid/tidaknya email.
            setSubmitted(true);
        } catch (err) {
            console.error("Forgot password error:", err);
            setError("Gagal terhubung ke server. Cek koneksi kamu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-black rounded-3xl p-1.5 shadow-2xl">
                <div className="flex flex-col md:flex-row rounded-[20px] overflow-hidden">
                    {/* Left side - form */}
                    <div className="w-full md:w-1/2 bg-white px-8 py-10 sm:px-12 sm:py-12 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-10">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" width="90" height="35" role="img" aria-label="sentra logo">
                                <defs>
                                    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0" stop-color="#6366F1" />
                                        <stop offset="1" stop-color="#06B6D4" />
                                    </linearGradient>
                                </defs>

                                <rect x="0" y="0" width="360" height="140" rx="16" fill="#FFFFFF" />

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
                                        font-size="20" font-weight="700" fill="#FFFFFF">S</text>
                                </g>

                                <text x="160" y="84" text-anchor="start"
                                    font-family="'Inter','Segoe UI','Helvetica Neue',Arial,sans-serif"
                                    font-size="52" font-weight="600" letter-spacing="1" fill="#1D4ED8">sentra</text>
                            </svg>
                        </div>

                        {!submitted ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition w-fit"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Login
                                </button>

                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    Forgot Password?
                                </h1>
                                <p className="text-sm text-slate-500 mb-8">
                                    Jangan khawatir! Masukkan email kamu dan kami akan
                                    mengirimkan link untuk reset password.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-slate-800 mb-2"
                                        >
                                            Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={email}
                                                onChange={handleEmailChange}
                                                disabled={loading}
                                                placeholder="Masukkan Email"
                                                className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 transition disabled:bg-slate-50 disabled:cursor-not-allowed ${error
                                                        ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                                                        : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                                    }`}
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-xs text-red-500 mt-1.5">{error}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition mt-2 flex items-center justify-center gap-2"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {loading ? "Mengirim..." : "Send Reset Link"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    Check Your Email
                                </h1>
                                <p className="text-sm text-slate-500 mb-1">
                                    Jika email kamu terdaftar, link reset password sudah dikirim ke
                                </p>
                                <p className="text-sm font-semibold text-slate-800 mb-8">
                                    {email}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate("/")}
                                    className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-3 rounded-xl transition"
                                >
                                    Back to Login
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSubmitted(false);
                                        setEmail("");
                                    }}
                                    className="text-sm text-blue-700 hover:text-blue-800 font-medium mt-4 transition"
                                >
                                    Try a different email
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right side - illustration */}
                    <div className="hidden md:flex w-1/2 bg-blue-100 items-center justify-center p-8">
                        <div className="w-full max-w-sm aspect-square bg-blue-200/60 rounded-2xl flex items-center justify-center overflow-hidden">
                            <img
                                src="/assets/gambar.png"
                                className="w-full h-full object-contain p-4"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}