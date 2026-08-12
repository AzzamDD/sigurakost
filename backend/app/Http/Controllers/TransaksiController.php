<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Models\DetailTransaksi;
use App\Models\StokToko;
use App\Models\Produk;
use App\Models\Toko;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TransaksiController extends Controller
{
    // ✅ Konsisten lowercase + trim, sama dengan frontend
    private function isAdmin(Request $request): bool
    {
        return trim(strtolower($request->user()->role?->nama ?? '')) === 'admin';
    }

    private function tokoMilikKasir(Request $request): ?Toko
    {
        return Toko::where('operator_id', $request->user()->id)->first();
    }

    public function index(Request $request)
    {
        $query = Transaksi::with(['detailTransaksi.produk', 'toko', 'pengguna'])
            ->orderBy('id', 'desc');

        if ($this->isAdmin($request)) {
            // Admin boleh filter by toko
            if ($request->filled('toko_id')) {
                $query->where('toko_id', $request->toko_id);
            }
        } else {
            // Kasir hanya lihat transaksi toko miliknya
            $toko = $this->tokoMilikKasir($request);
            if (!$toko) {
                return response()->json([
                    'message' => 'Akun ini belum ditugaskan ke toko manapun. Hubungi admin.',
                    'code'    => 'NO_TOKO',
                ], 403);
            }
            $query->where('toko_id', $toko->id);
        }

        $perPage = (int) $request->get('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function show(Request $request, $id)
    {
        $transaksi = Transaksi::with([
            'detailTransaksi.produk',
            'toko',
            'pengguna',
        ])->findOrFail($id);

        if (!$this->isAdmin($request)) {
            $toko = $this->tokoMilikKasir($request);
            if (!$toko || $transaksi->toko_id !== $toko->id) {
                return response()->json([
                    'message' => 'Anda tidak punya akses ke transaksi ini.',
                ], 403);
            }
        }

        return response()->json($transaksi);
    }

    public function store(Request $request)
    {
        $isAdmin = $this->isAdmin($request);

        $rules = [
            'nama_pelanggan'       => 'nullable|string|max:255',
            'no_hp'                => 'nullable|string|max:20',
            'pajak' => 'required|integer|min:0',
            'items'                => 'required|array|min:1',
            'items.*.produk_id'    => 'required|integer|exists:produk,id',
            'items.*.jumlah'       => 'required|integer|min:1',
        ];

        if ($isAdmin) {
            $rules['toko_id'] = 'required|integer|exists:toko,id';
        }

        $validated = $request->validate($rules);

        if ($isAdmin) {
            $tokoId = $validated['toko_id'];
        } else {
            $toko = $this->tokoMilikKasir($request);
            if (!$toko) {
                return response()->json([
                    'message' => 'Akun ini belum ditugaskan ke toko manapun. Hubungi admin.',
                    'code'    => 'NO_TOKO',
                ], 403);
            }
            $tokoId = $toko->id;
        }

        try {
            $transaksi = DB::transaction(function () use ($validated, $tokoId) {
                $subTotal   = 0;
                $detailRows = [];

                foreach ($validated['items'] as $item) {
                    $produk = Produk::findOrFail($item['produk_id']);

                    $stokToko = StokToko::where('toko_id', $tokoId)
                        ->where('produk_id', $item['produk_id'])
                        ->lockForUpdate()
                        ->first();

                    if (!$stokToko) {
                        throw ValidationException::withMessages([
                            'items' => ["Produk '{$produk->nama}' tidak terdaftar di stok toko ini."],
                        ]);
                    }

                    if ($stokToko->stok < $item['jumlah']) {
                        throw ValidationException::withMessages([
                            'items' => ["Stok '{$produk->nama}' tidak cukup. Sisa stok: {$stokToko->stok}."],
                        ]);
                    }

                    $hargaSatuan  = (int) $produk->harga;
                    $subTotalItem = $hargaSatuan * $item['jumlah'];
                    $subTotal    += $subTotalItem;

                    $stokToko->decrement('stok', $item['jumlah']);

                    $detailRows[] = [
                        'produk_id' => $item['produk_id'],
                        'jumlah'    => $item['jumlah'],
                        'harga'     => $hargaSatuan,
                        'sub_total' => $subTotalItem,
                    ];
                }

                $pajak      = (int) ($validated['pajak'] ?? 0);
                $totalBayar = $subTotal + $pajak;

                $transaksi = Transaksi::create([
                    'nama_pelanggan' => $validated['nama_pelanggan'] ?? null,
                    'no_hp'          => $validated['no_hp'] ?? null,
                    'sub_total'      => $subTotal,
                    'pajak'          => $pajak,
                    'total_bayar'    => $totalBayar,
                    'toko_id'        => $tokoId,
                    'pengguna_id'    => Auth::id(),
                ]);

                foreach ($detailRows as $row) {
                    $row['transaksi_id'] = $transaksi->id;
                    DetailTransaksi::create($row);
                }

                return $transaksi->load(['detailTransaksi.produk', 'toko', 'pengguna']);
            });

            return response()->json($transaksi, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => collect($e->errors())->flatten()->first(),
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Gagal menyimpan transaksi: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ✅ destroy() — proteksi sudah di route middleware('role:admin')
    //    tapi tetap ada fallback manual biar aman kalau middleware dilepas
    public function destroy(Request $request, $id)
    {
        if (!$this->isAdmin($request)) {
            return response()->json([
                'message' => 'Hanya admin yang dapat membatalkan transaksi.',
            ], 403);
        }

        $transaksi = Transaksi::with('detailTransaksi')->findOrFail($id);

        DB::transaction(function () use ($transaksi) {
            foreach ($transaksi->detailTransaksi as $detail) {
                StokToko::where('toko_id', $transaksi->toko_id)
                    ->where('produk_id', $detail->produk_id)
                    ->increment('stok', $detail->jumlah);
            }
            $transaksi->detailTransaksi()->delete();
            $transaksi->delete();
        });

        return response()->json([
            'message' => 'Transaksi dibatalkan, stok sudah dikembalikan.',
        ]);
    }

    // ✅ Produk yang tersedia buat dijual — SUMBER-nya dari stok_toko, BUKAN produk global.
    // Kasir gak kirim toko_id sama sekali (dipaksa dari session dia).
    // Admin WAJIB kirim toko_id, dan itu divalidasi milik toko yang beneran ada.
    public function produkTersedia(Request $request)
    {
        $isAdmin = $this->isAdmin($request);

        if ($isAdmin) {
            $request->validate([
                'toko_id' => 'required|integer|exists:toko,id',
            ]);
            $tokoId = (int) $request->toko_id;
        } else {
            $toko = $this->tokoMilikKasir($request);
            if (!$toko) {
                return response()->json([
                    'message' => 'Akun ini belum ditugaskan ke toko manapun. Hubungi admin.',
                    'code'    => 'NO_TOKO',
                ], 403);
            }
            $tokoId = $toko->id;
        }

        // ✅ stok > 0 doang yang muncul di dropdown — produk dengan stok 0
        // gak usah dipajang, cuma bikin kasir salah klik lalu gagal pas submit.
        $items = StokToko::with('produk')
            ->where('toko_id', $tokoId)
            ->where('stok', '>', 0)
            ->get()
            ->map(function ($s) {
                return [
                    'id'    => $s->produk->id,
                    'nama'  => $s->produk->nama,
                    'harga' => (int) $s->produk->harga,
                    'stok'  => (int) $s->stok,
                ];
            })
            ->values();

        return response()->json($items);
    }
}
