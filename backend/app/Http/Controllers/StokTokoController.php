<?php

namespace App\Http\Controllers;

use App\Models\StokToko;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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