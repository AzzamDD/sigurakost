import { createContext, useContext, useState, useEffect, type ReactNode } from "react";


type UserData = {
    id: number;
    nama: string;
    email: string;
    foto: string | null;
    no_hp: string | null;
};

type UserContextType = {
    user: UserData | null;
    loading: boolean;
    setUser: (user: UserData) => void;
    refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch {
            // biarin, halaman yang butuh proteksi bisa handle sendiri
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, setUser, refreshUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser harus dipakai di dalam UserProvider");
    }
    return context;
}