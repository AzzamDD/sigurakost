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
    private function isAdmin(Request $request): bool
    {
        return $request->user()->role?->nama === 'admin';
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
            if ($request->filled('toko_id')) {
                $query->where('toko_id', $request->toko_id);
            }
        } else {
            $toko = $this->tokoMilikKasir($request);
            if (!$toko) {
                return response()->json([
                    'message' => 'Akun ini belum ditugaskan ke toko manapun. Hubungi admin.',
                ], 403);
            }
            $query->where('toko_id', $toko->id);
        }

        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function show(Request $request, $id)
    {
        $transaksi = Transaksi::with(['detailTransaksi.produk', 'toko', 'pengguna'])->findOrFail($id);

        if (!$this->isAdmin($request)) {
            $toko = $this->tokoMilikKasir($request);
            if (!$toko || $transaksi->toko_id !== $toko->id) {
                return response()->json(['message' => 'Anda tidak punya akses ke transaksi ini.'], 403);
            }
        }

        return response()->json($transaksi);
    }

    public function store(Request $request)
    {
        $isAdmin = $this->isAdmin($request);

        $rules = [
            'nama_pelanggan' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'pajak' => 'nullable|integer|min:0',
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|integer|exists:produk,id',
            'items.*.jumlah' => 'required|integer|min:1',
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
                ], 403);
            }
            $tokoId = $toko->id;
        }

        try {
            $transaksi = DB::transaction(function () use ($validated, $tokoId) {
                $subTotal = 0;
                $detailRows = [];

                foreach ($validated['items'] as $item) {
                    $produk = Produk::findOrFail($item['produk_id']);

                    $stokToko = StokToko::where('toko_id', $tokoId)
                        ->where('produk_id', $item['produk_id'])
                        ->lockForUpdate()
                        ->first();

                    if (!$stokToko) {
                        throw ValidationException::withMessages([
                            'items' => "Produk '{$produk->nama}' tidak terdaftar di stok toko ini.",
                        ]);
                    }

                    if ($stokToko->stok < $item['jumlah']) {
                        throw ValidationException::withMessages([
                            'items' => "Stok '{$produk->nama}' tidak cukup. Sisa stok: {$stokToko->stok}.",
                        ]);
                    }

                    $hargaSatuan = $produk->harga;
                    $subTotalItem = $hargaSatuan * $item['jumlah'];
                    $subTotal += $subTotalItem;

                    $stokToko->decrement('stok', $item['jumlah']);

                    $detailRows[] = [
                        'produk_id' => $item['produk_id'],
                        'jumlah' => $item['jumlah'],
                        'harga' => $hargaSatuan,
                        'sub_total' => $subTotalItem,
                    ];
                }

                $pajak = $validated['pajak'] ?? 0;
                $totalBayar = $subTotal + $pajak;

                $transaksi = Transaksi::create([
                    'nama_pelanggan' => $validated['nama_pelanggan'] ?? null,
                    'no_hp' => $validated['no_hp'] ?? null,
                    'sub_total' => $subTotal,
                    'pajak' => $pajak,
                    'total_bayar' => $totalBayar,
                    'toko_id' => $tokoId,
                    'pengguna_id' => Auth::id(),
                ]);

                foreach ($detailRows as $row) {
                    $row['transaksi_id'] = $transaksi->id;
                    DetailTransaksi::create($row);
                }

                return $transaksi->load('detailTransaksi.produk');
            });

            return response()->json($transaksi, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy($id)
    {
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

        return response()->json(['message' => 'Transaksi dibatalkan, stok sudah dikembalikan.']);
    }
}