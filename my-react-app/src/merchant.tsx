import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
  MapPin,
  Phone,
  Plus,
  Pencil,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  Tag,
  Layers,
  X,
  PackagePlus,
  PlusCircle,
  Minus,
  PlusIcon,
  Smartphone,
  UserCircle,
  Receipt,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/* ---------- Types ---------- */
type Kategori = { id: number; name: string };

type ProdukData = {
  id: number;
  nama: string;
  thumbnail: string | null;
  harga: number;
  kategori_id: number;
  kategori?: Kategori;
};

type GudangData = { id: number; nama: string };

// ✅ Tipe untuk list pengguna (keeper)
type PenggunaData = {
  id: number;
  nama: string;
  email: string;
  foto: string | null;
  no_hp: string | null;
  role_id: number | null;
  role?: { id: number; nama: string } | null;
};

type TokoData = {
  id: number;
  nama: string;
  alamat: string | null;
  foto: string | null;
  no_hp: string | null;
  operator_id: number | null;
  operator?: PenggunaData | null; // ✅ dari relasi eager load
  stok_toko_count?: number;
};

type GudangStokOption = {
  id: number;
  produk_id: number;
  gudang_id: number;
  stok: number;
  produk: ProdukData;
};

type StokTokoData = {
  id: number;
  toko_id: number;
  produk_id: number;
  stok: number;
  gudang_id: number | null;
  produk: ProdukData;
  gudang?: GudangData | null;
};

// ✅ Tambah operator_id ke form
type TokoForm = {
  nama: string;
  alamat: string;
  no_hp: string;
  foto: string | null;
  operator_id: string; // string biar kompatibel dengan <select> value
};

type ViewMode = "list" | "add" | "edit" | "detail";

const emptyTokoForm: TokoForm = {
  nama: "",
  alamat: "",
  no_hp: "",
  foto: null,
  operator_id: "", // ✅ kosong = tidak dipilih
};

const formatRupiah = (value: number) =>
  `Rp ${Number(value).toLocaleString("id-ID")}`;

export default function MerchantPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<ViewMode>("list");
  const [tokoList, setTokoList] = useState<TokoData[]>([]);
  const [loadingToko, setLoadingToko] = useState(true);
  const [selectedTokoId, setSelectedTokoId] = useState<number | null>(null);
  const [selectedToko, setSelectedToko] = useState<TokoData | null>(null);
  const [stokList, setStokList] = useState<StokTokoData[]>([]);
  const [loadingStok, setLoadingStok] = useState(false);

  const [formData, setFormData] = useState<TokoForm>(emptyTokoForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submittingToko, setSubmittingToko] = useState(false);

  // ✅ State untuk list pengguna (keeper dropdown)
  const [penggunaList, setPenggunaList] = useState<PenggunaData[]>([]);
  const [loadingPengguna, setLoadingPengguna] = useState(true);

  // Assign product
  const [gudangList, setGudangList] = useState<GudangData[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignGudangId, setAssignGudangId] = useState<string>("");
  const [gudangStokList, setGudangStokList] = useState<GudangStokOption[]>([]);
  const [loadingGudangStok, setLoadingGudangStok] = useState(false);
  const [assignProdukId, setAssignProdukId] = useState<string>("");
  const [assignJumlah, setAssignJumlah] = useState<string>("");
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [detailProduct, setDetailProduct] = useState<StokTokoData | null>(null);
  const [stockTarget, setStockTarget] = useState<StokTokoData | null>(null);
  const [stockQty, setStockQty] = useState<number>(1);
  const [submittingStock, setSubmittingStock] = useState(false);
  const [addStockGudangId, setAddStockGudangId] = useState<string>("");
  const [addStockGudangStokList, setAddStockGudangStokList] = useState<GudangStokOption[]>([]);
  const [loadingAddStockGudang, setLoadingAddStockGudang] = useState(false);

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

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}`, Accept: "application/json" };
  };

  /* ---------- Fetch ---------- */
  const fetchToko = async () => {
    setLoadingToko(true);
    try {
      const res = await fetch(`${API_URL}/toko`, { headers: authHeaders() });
      if (res.ok) setTokoList(await res.json());
    } finally {
      setLoadingToko(false);
    }
  };

  const fetchGudang = async () => {
    try {
      const res = await fetch(`${API_URL}/gudang`, { headers: authHeaders() });
      if (res.ok) setGudangList(await res.json());
    } catch {
      // opsional
    }
  };

  const fetchStokGudangList = async (gudangId: string): Promise<GudangStokOption[]> => {
    if (!gudangId) return [];
    try {
      const res = await fetch(`${API_URL}/stok-gudang?gudang_id=${gudangId}`, {
        headers: authHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // biarin, return array kosong di bawah
    }
    return [];
  };

  // ✅ Fetch pengguna untuk dropdown keeper
  const fetchPengguna = async () => {
    setLoadingPengguna(true);
    try {
      const res = await fetch(`${API_URL}/pengguna`, { headers: authHeaders() });
      if (res.ok) setPenggunaList(await res.json());
    } finally {
      setLoadingPengguna(false);
    }
  };

  const fetchStokToko = async (tokoId: number) => {
    setLoadingStok(true);
    try {
      const res = await fetch(`${API_URL}/stok-toko?toko_id=${tokoId}`, {
        headers: authHeaders(),
      });
      if (res.ok) setStokList(await res.json());
    } finally {
      setLoadingStok(false);
    }
  };

  useEffect(() => {
    fetchToko();
    fetchGudang();
    fetchPengguna(); // ✅ dipanggil di sini
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* ---------- Form Toko ---------- */
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = () => {
    setFormData(emptyTokoForm);
    setEditingId(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setView("add");
  };

  const openEditForm = (toko: TokoData) => {
    setFormData({
      nama: toko.nama,
      alamat: toko.alamat ?? "",
      no_hp: toko.no_hp ?? "",
      foto: toko.foto,
      operator_id: toko.operator_id ? String(toko.operator_id) : "", // ✅ convert ke string
    });
    setEditingId(toko.id);
    setSelectedFile(null);
    setPreviewUrl(null);
    setView("edit");
  };

  const openDetail = (toko: TokoData) => {
    setSelectedTokoId(toko.id);
    setSelectedToko(toko);
    setView("detail");
    fetchStokToko(toko.id);
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

  const uploadPhoto = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("folder", "toko");
    const res = await fetch(`${API_URL}/upload/image`, {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal upload foto");
    return data.url as string;
  };

  const submitMerchant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittingToko(true);

    try {
      let fotoUrl = formData.foto;

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

      const isEdit = editingId !== null;
      const url = isEdit ? `${API_URL}/toko/${editingId}` : `${API_URL}/toko`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          nama: formData.nama,
          alamat: formData.alamat,
          no_hp: formData.no_hp,
          foto: fotoUrl,
          // ✅ kirim operator_id — null kalau kosong, number kalau dipilih
          operator_id: formData.operator_id ? Number(formData.operator_id) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal menyimpan merchant");
        return;
      }

      await fetchToko();

      if (isEdit) {
        setSelectedToko(data); // data dari server sudah include operator (karena load di controller)
        setView("detail");
      } else {
        setView("list");
      }

      setFormData(emptyTokoForm);
      setEditingId(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch {
      alert("Tidak dapat terhubung ke server");
    } finally {
      setSubmittingToko(false);
    }
  };

  const cancelForm = () => {
    setFormData(emptyTokoForm);
    setSelectedFile(null);
    setPreviewUrl(null);
    setView(editingId !== null ? "detail" : "list");
    setEditingId(null);
  };

  /* ---------- Assign product ---------- */
  const openAssignModal = () => {
    setAssignGudangId("");
    setGudangStokList([]);
    setAssignProdukId("");
    setAssignJumlah("");
    setAssignError(null);
    setIsAssignOpen(true);
  };

  const closeAssignModal = () => setIsAssignOpen(false);

  const handleAssignGudangChange = async (gudangId: string) => {
    setAssignGudangId(gudangId);
    setAssignProdukId("");
    setAssignJumlah("");
    setLoadingGudangStok(true);
    const list = await fetchStokGudangList(gudangId);
    setGudangStokList(list);
    setLoadingGudangStok(false);
  };

  const assignedProdukIds = new Set(stokList.map((s) => s.produk_id));
  const availableGudangStok = gudangStokList.filter(
    (s) => !assignedProdukIds.has(s.produk_id) && s.stok > 0
  );
  const selectedGudangStok =
    gudangStokList.find((s) => s.produk_id === Number(assignProdukId)) ?? null;

  const submitAssignProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedTokoId === null || !selectedGudangStok) return;

    const jumlah = Number(assignJumlah);
    if (!jumlah || jumlah < 1) {
      setAssignError("Jumlah harus diisi minimal 1.");
      return;
    }
    if (jumlah > selectedGudangStok.stok) {
      setAssignError(`Jumlah melebihi stok gudang (tersedia ${selectedGudangStok.stok}).`);
      return;
    }

    setSubmittingAssign(true);
    setAssignError(null);

    try {
      const res = await fetch(`${API_URL}/stok-toko/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          toko_id: selectedTokoId,
          produk_id: selectedGudangStok.produk_id,
          gudang_id: Number(assignGudangId),
          jumlah,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          setAssignError(Array.isArray(firstError) ? firstError[0] as string : data.message);
        } else {
          setAssignError(data.message || "Gagal assign produk");
        }
        return;
      }

      await fetchStokToko(selectedTokoId);
      await fetchToko();
      closeAssignModal();
    } catch {
      setAssignError("Tidak dapat terhubung ke server");
    } finally {
      setSubmittingAssign(false);
    }
  };

  /* ---------- Product detail ---------- */
  const openProductDetail = (item: StokTokoData) => setDetailProduct(item);
  const closeProductDetail = () => setDetailProduct(null);

  /* ---------- Add stock ---------- */
   const openAddStock = (item: StokTokoData) => {
    setStockTarget(item);
    setStockQty(1);
    setAddStockGudangId("");
    setAddStockGudangStokList([]);
  };

  const closeAddStock = () => {
    setStockTarget(null);
    setStockQty(1);
    setAddStockGudangId("");
    setAddStockGudangStokList([]);
  };

  const handleAddStockGudangChange = async (gudangId: string) => {
    setAddStockGudangId(gudangId);
    setStockQty(1);
    setLoadingAddStockGudang(true);
    const list = await fetchStokGudangList(gudangId);
    setAddStockGudangStokList(list);
    setLoadingAddStockGudang(false);
  };

  const currentGudangStokForTarget = stockTarget
    ? addStockGudangStokList.find((s) => s.produk_id === stockTarget.produk_id) ?? null
    : null;

  const confirmAddStock = async () => {
    if (selectedTokoId === null || !stockTarget || stockQty <= 0) {
      closeAddStock();
      return;
    }

    if (!addStockGudangId) {
      alert("Pilih gudang sumber dulu.");
      return;
    }

    if (!currentGudangStokForTarget) {
      alert("Produk ini tidak tersedia di gudang yang dipilih.");
      return;
    }

    if (stockQty > currentGudangStokForTarget.stok) {
      alert(`Jumlah melebihi stok gudang (tersedia ${currentGudangStokForTarget.stok}).`);
      return;
    }

    setSubmittingStock(true);
    try {
      const res = await fetch(`${API_URL}/stok-toko/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          toko_id: selectedTokoId,
          produk_id: stockTarget.produk_id,
          gudang_id: Number(addStockGudangId),
          jumlah: stockQty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Gagal menambah stok");
        return;
      }

      await fetchStokToko(selectedTokoId);
      closeAddStock();
    } catch {
      alert("Tidak dapat terhubung ke server");
    } finally {
      setSubmittingStock(false);
    }
  };

  const displayedPhoto = previewUrl ?? formData.foto;

  // ✅ Helper: cari nama pengguna dari id
  const getKeeperName = (toko: TokoData) => {
    if (toko.operator) return toko.operator.nama;
    if (!toko.operator_id) return null;
    const found = penggunaList.find((p) => p.id === toko.operator_id);
    return found?.nama ?? null;
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex-col hidden md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <img
            src="/assets/sigurakost.png"
            alt="SiguraKost logo"
            className="w-6 h-6 object-contain bg-slate-200 rounded-sm"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between gap-4 px-8 py-5 bg-slate-100/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200/50">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {view === "list" && "Manage Merchants"}
              {view === "add" && "Add New Merchant"}
              {view === "edit" && "Edit Merchant"}
              {view === "detail" && "Merchant Details"}
            </h1>
          </div>
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

        <main className="flex-1 px-8 pb-8 pt-4 overflow-y-auto">
          {/* ===== LIST VIEW ===== */}
          {view === "list" && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-xl border border-slate-200 px-6 py-5 mb-6 flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-5 h-5 text-blue-700" />
                    <p className="text-lg font-bold text-slate-800">
                      {tokoList.length} Total Merchants
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">
                    View and update your Merchants list here.
                  </p>
                </div>
                <button
                  onClick={openAddForm}
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition shrink-0 shadow-sm"
                >
                  Add New
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <p className="text-base font-semibold text-slate-800 mb-4">
                  All Merchants
                </p>
                {loadingToko ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Memuat data merchant...
                  </div>
                ) : tokoList.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">
                    <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600">
                      Belum ada merchant
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tokoList.map((toko) => {
                      const keeperName = getKeeperName(toko);
                      return (
                        <div
                          key={toko.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0 last:pb-0"
                        >
                          <button
                            type="button"
                            onClick={() => openDetail(toko)}
                            className="flex items-center gap-4 text-left"
                          >
                            <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                              {toko.foto ? (
                                <img
                                  src={toko.foto}
                                  alt={toko.nama}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 hover:text-blue-700 transition">
                                {toko.nama}
                              </p>
                              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {toko.alamat || "-"}
                              </div>
                              {/* ✅ Tampilkan keeper di list */}
                              {keeperName && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                  <UserCircle className="w-3 h-3" />
                                  {keeperName}
                                </div>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg shrink-0">
                            <Layers className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">
                              {toko.stok_toko_count ?? 0} Products
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => openDetail(toko)}
                              className="inline-flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditForm(toko)}
                              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-sm font-semibold px-5 py-2 rounded-full transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== DETAIL VIEW ===== */}
          {view === "detail" && selectedToko && (
            <div className="max-w-6xl mx-auto space-y-6">
              <button
                onClick={() => setView("list")}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Manage Merchants
              </button>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                    {selectedToko.foto ? (
                      <img
                        src={selectedToko.foto}
                        alt={selectedToko.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedToko.nama}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedToko.no_hp || "-"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedToko.alamat || "-"}
                      </span>
                      {/* ✅ Keeper di detail view */}
                      <span className="flex items-center gap-1.5">
                        <UserCircle className="w-3.5 h-3.5" />
                        {getKeeperName(selectedToko) ?? "Tidak ada keeper"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openEditForm(selectedToko)}
                  className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition shrink-0 shadow-sm"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Merchant
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-700" />
                    <p className="text-base font-semibold text-slate-800">
                      {stokList.length} Total Products
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAssignModal}
                    className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-full transition shrink-0 shadow-sm"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    Assign a Product
                  </button>
                </div>

                {loadingStok ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    Memuat data stok...
                  </div>
                ) : stokList.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center">
                    <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600">
                      Belum ada produk untuk merchant ini
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stokList.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                            {item.produk.thumbnail ? (
                              <img
                                src={item.produk.thumbnail}
                                alt={item.produk.nama}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {item.produk.nama}
                            </p>
                            <p className="text-sm text-blue-700 font-semibold mt-1">
                              {formatRupiah(item.produk.harga)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 flex-wrap">
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-700">
                              {item.stok} Stock
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">
                            <Tag className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-700">
                              {item.produk.kategori?.name ?? "-"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openProductDetail(item)}
                            className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium px-3.5 py-1.5 rounded-full transition"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => openAddStock(item)}
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Add Stock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== ADD / EDIT VIEW ===== */}
          {(view === "add" || view === "edit") && (
            <div className="max-w-6xl mx-auto space-y-6">
              <button
                onClick={cancelForm}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                {view === "edit" ? "Merchant Details" : "Manage Merchants"}
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-800 mb-6">
                    {view === "edit" ? "Update The Form" : "Complete The Form"}
                  </h2>

                  <form onSubmit={submitMerchant} className="space-y-5">
                    {/* Photo */}
                    <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {displayedPhoto ? (
                          <img
                            src={displayedPhoto}
                            alt="Merchant preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
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
                        className="bg-slate-900 hover:bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                      >
                        {displayedPhoto ? "Change Photo" : "Add Photo"}
                      </button>
                    </div>

                    {selectedFile && (
                      <p className="text-xs text-slate-400">
                        Foto "{selectedFile.name}" akan diupload saat kamu klik
                        simpan
                      </p>
                    )}

                    {/* Name */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Store className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="nama"
                        value={formData.nama}
                        onChange={handleFormChange}
                        placeholder="Merchant Name"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>

                    {/* Phone */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        name="no_hp"
                        value={formData.no_hp}
                        onChange={handleFormChange}
                        placeholder="Phone Number"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>

                    {/* ✅ Keeper Dropdown — sekarang aktif karena /pengguna sudah ada */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserCircle className="w-5 h-5 text-slate-400" />
                      </div>
                      <select
                        name="operator_id"
                        value={formData.operator_id}
                        onChange={handleFormChange}
                        disabled={loadingPengguna}
                        className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                      >
                        <option value="">
                          {loadingPengguna
                            ? "Memuat data user..."
                            : "Select Keeper (opsional)"}
                        </option>
                        {penggunaList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nama}
                            {p.role?.nama ? ` — ${p.role.nama}` : ""}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="relative">
                      <div className="absolute top-3.5 left-0 pl-4 pointer-events-none">
                        <MapPin className="w-5 h-5 text-slate-400" />
                      </div>
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleFormChange}
                        placeholder="Merchants Address"
                        rows={4}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={cancelForm}
                        disabled={submittingToko}
                        className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-6 py-2.5 rounded-full text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingToko}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingToko
                          ? "Menyimpan..."
                          : view === "edit"
                            ? "Save Changes"
                            : "Create Now"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-fit">
                  <h3 className="text-sm font-bold text-slate-800 mb-5">
                    {view === "edit"
                      ? "Quick Guide to Update Merchant"
                      : "Quick Guide to Add New Merchant"}
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Masukkan Nama Merchant – Gunakan nama merchant yang jelas dan mudah dikenali.",
                      "Isi Nomor Telepon – Pastikan nomor telepon yang dimasukkan aktif dan dapat dihubungi.",
                      "Pilih Keeper – Pilih user yang bertanggung jawab mengelola merchant ini (opsional).",
                      "Lengkapi Alamat Merchant – Pastikan alamat merchant diisi dengan lengkap dan benar.",
                      "Unggah Foto Merchant – Tambahkan foto merchant yang jelas agar mudah dikenali.",
                    ].map((text, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-xs text-slate-500 leading-relaxed">
                          {text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- ASSIGN PRODUCT MODAL --- */}
      {isAssignOpen && selectedToko && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeAssignModal}
          />
          <form
            onSubmit={submitAssignProduct}
            className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Assign a Product
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  to {selectedToko.nama}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssignModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {assignError && (
                <p className="text-xs text-rose-500">{assignError}</p>
              )}

                            <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  1. Pilih Gudang Sumber
                </label>
                <div className="relative">
                  <select
                    value={assignGudangId}
                    onChange={(e) => handleAssignGudangChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="" disabled>
                      Pilih gudang
                    </option>
                    {gudangList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {selectedGudangStok && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50">
                  <div className="w-11 h-11 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {selectedGudangStok.produk.thumbnail ? (
                      <img
                        src={selectedGudangStok.produk.thumbnail}
                        alt={selectedGudangStok.produk.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Smartphone className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {selectedGudangStok.produk.nama}
                    </p>
                    <p className="text-xs text-blue-600 font-semibold">
                      {formatRupiah(selectedGudangStok.produk.harga)} &middot; Stok
                      gudang: {selectedGudangStok.stok}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  2. Pilih Produk
                </label>
                <div className="relative">
                  <select
                    value={assignProdukId}
                    onChange={(e) => setAssignProdukId(e.target.value)}
                    required
                    disabled={!assignGudangId || loadingGudangStok}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                  >
                    <option value="" disabled>
                      {!assignGudangId
                        ? "Pilih gudang dulu"
                        : loadingGudangStok
                        ? "Memuat produk..."
                        : "Pilih produk"}
                    </option>
                    {availableGudangStok.map((s) => (
                      <option key={s.produk_id} value={s.produk_id}>
                        {s.produk.nama} — Stok: {s.stok}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                {assignGudangId && !loadingGudangStok && availableGudangStok.length === 0 && (
                  <p className="text-xs text-rose-500 mt-2">
                    Gudang ini tidak punya produk dengan stok tersedia, atau semua
                    produknya sudah di-assign ke merchant ini.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  3. Jumlah Transfer
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedGudangStok?.stok ?? undefined}
                  value={assignJumlah}
                  onChange={(e) => setAssignJumlah(e.target.value)}
                  placeholder="0"
                  required
                  disabled={!selectedGudangStok}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:opacity-50"
                />
                {selectedGudangStok && (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Maksimal {selectedGudangStok.stok} unit (stok tersedia di gudang).
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeAssignModal}
                disabled={submittingAssign}
                className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-5 py-2.5 rounded-full text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedGudangStok || submittingAssign}
                className="bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-full text-sm transition shadow-sm"
              >
                {submittingAssign ? "Menyimpan..." : "Transfer & Assign"}
              </button>
            </div>

              
                
          </form>
        </div>
      )}

      {/* --- PRODUCT DETAIL MODAL --- */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeProductDetail}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">
                Product Details
              </h3>
              <button
                type="button"
                onClick={closeProductDetail}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {detailProduct.produk.thumbnail ? (
                    <img
                      src={detailProduct.produk.thumbnail}
                      alt={detailProduct.produk.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {detailProduct.produk.nama}
                  </p>
                  <p className="text-sm text-blue-700 font-semibold mt-1">
                    {formatRupiah(detailProduct.produk.harga)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Stock
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {detailProduct.stok} units
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Category
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {detailProduct.produk.kategori?.name ?? "-"}
                  </p>
                </div>
              </div>
              {detailProduct.gudang && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Asal Gudang
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {detailProduct.gudang.nama}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeProductDetail}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-5 py-2.5 rounded-full text-sm transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = detailProduct;
                  closeProductDetail();
                  if (item) openAddStock(item);
                }}
                className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD STOCK MODAL --- */}
      {stockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeAddStock}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Add Stock
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {stockTarget.produk.nama}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddStock}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
                      <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Current Stock
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {stockTarget.stok} units
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Gudang Sumber
                </label>
                <div className="relative">
                  <select
                    value={addStockGudangId}
                    onChange={(e) => handleAddStockGudangChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="" disabled>
                      Pilih gudang
                    </option>
                    {gudangList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                {addStockGudangId && !loadingAddStockGudang && !currentGudangStokForTarget && (
                  <p className="text-xs text-rose-500 mt-2">
                    Produk ini tidak tersedia di gudang tersebut.
                  </p>
                )}
                {currentGudangStokForTarget && (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Stok tersedia di gudang: {currentGudangStokForTarget.stok} unit.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
                  Quantity to Add
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStockQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={stockQty}
                    onChange={(e) =>
                      setStockQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full text-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setStockQty((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition shrink-0"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700">
                  New Total
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {stockTarget.stok + stockQty} units
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeAddStock}
                disabled={submittingStock}
                className="bg-red-50 hover:bg-red-100 text-red-500 font-semibold px-5 py-2.5 rounded-full text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddStock}
                disabled={submittingStock || !currentGudangStokForTarget}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingStock ? "Menyimpan..." : "Save Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}