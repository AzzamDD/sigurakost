<?php

namespace App\Http\Controllers;

use App\Models\StokToko;
use App\Models\StokGudang;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StokTokoController extends Controller
{
    // GET /stok-toko?toko_id=1
    public function index(Request $request): JsonResponse
    {
        $query = StokToko::with(['produk.kategori', 'gudang']);

        if ($request->has('toko_id')) {
            $query->where('toko_id', $request->query('toko_id'));
        }

        return response()->json($query->get());
    }

    // POST /stok-toko { produk_id, toko_id, stok, gudang_id? }
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'produk_id' => 'required|exists:produk,id',
            'toko_id' => 'required|exists:toko,id',
            'stok' => 'required|integer|min:0',
            'gudang_id' => 'nullable|exists:gudang,id',
        ]);

        $existing = StokToko::where('produk_id', $validated['produk_id'])
            ->where('toko_id', $validated['toko_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Produk ini sudah terdaftar di toko ini. Gunakan fitur "Add Stock" untuk menambah jumlahnya.',
            ], 422);
        }

        $stokToko = StokToko::create($validated);
        $stokToko->load('produk.kategori', 'gudang');

        return response()->json($stokToko, 201);
    }

    // PUT /stok-toko/{id} { tambah }
    public function update(Request $request, int $id): JsonResponse
    {
        $stokToko = StokToko::find($id);

        if (!$stokToko) {
            return response()->json(['message' => 'Data stok tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'tambah' => 'required|integer|min:1',
        ]);

        $stokToko->stok += $validated['tambah'];
        $stokToko->save();
        $stokToko->load('produk.kategori', 'gudang');

        return response()->json($stokToko);
    }

     public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'toko_id' => 'required|exists:toko,id',
            'produk_id' => 'required|exists:produk,id',
            'gudang_id' => 'required|exists:gudang,id',
            'jumlah' => 'required|integer|min:1',
        ]);

        try {
            $stokToko = DB::transaction(function () use ($validated) {
                // Lock baris stok_gudang biar gak race condition kalau
                // 2 admin transfer produk yang sama dari gudang yang sama bareng.
                $stokGudang = StokGudang::where('gudang_id', $validated['gudang_id'])
                    ->where('produk_id', $validated['produk_id'])
                    ->lockForUpdate()
                    ->first();

                if (!$stokGudang) {
                    throw ValidationException::withMessages([
                        'produk_id' => 'Produk ini tidak terdaftar di gudang yang dipilih.',
                    ]);
                }

                if ($stokGudang->stok < $validated['jumlah']) {
                    throw ValidationException::withMessages([
                        'jumlah' => "Stok gudang tidak cukup. Sisa stok: {$stokGudang->stok}.",
                    ]);
                }

                $stokGudang->decrement('stok', $validated['jumlah']);

                $stokToko = StokToko::where('toko_id', $validated['toko_id'])
                    ->where('produk_id', $validated['produk_id'])
                    ->lockForUpdate()
                    ->first();

                if ($stokToko) {
                    // Produk udah ada di toko ini -> tambah stoknya (kasus "Add Stock")
                    $stokToko->stok += $validated['jumlah'];
                    $stokToko->gudang_id = $validated['gudang_id']; // catat sumber terbaru
                    $stokToko->save();
                } else {
                    // Produk baru di toko ini -> assign pertama kali
                    $stokToko = StokToko::create([
                        'toko_id' => $validated['toko_id'],
                        'produk_id' => $validated['produk_id'],
                        'stok' => $validated['jumlah'],
                        'gudang_id' => $validated['gudang_id'],
                    ]);
                }

                return $stokToko->load('produk.kategori', 'gudang');
            });

            return response()->json($stokToko, 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $stokToko = StokToko::find($id);

        if (!$stokToko) {
            return response()->json(['message' => 'Data stok tidak ditemukan'], 404);
        }

        $stokToko->delete();

        return response()->json(['message' => 'Produk berhasil dihapus dari toko']);
    }
}