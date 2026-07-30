<?php

namespace App\Http\Controllers;

use App\Models\StokGudang;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StokGudangController extends Controller
{
    // GET /stok-gudang?gudang_id=1  -> daftar stok produk di satu gudang
    public function index(Request $request): JsonResponse
    {
        $query = StokGudang::with(['produk.kategori']);

        if ($request->has('gudang_id')) {
            $query->where('gudang_id', $request->query('gudang_id'));
        }

        return response()->json($query->get());
    }

    // POST /stok-gudang { produk_id, gudang_id, stok }
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'produk_id' => 'required|exists:produk,id',
            'gudang_id' => 'required|exists:gudang,id',
            'stok' => 'required|integer|min:0',
        ]);

        // Cegah duplikat: kalau produk ini udah ada di gudang ini, tolak — suruh pakai endpoint update stok
        $existing = StokGudang::where('produk_id', $validated['produk_id'])
            ->where('gudang_id', $validated['gudang_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Produk ini sudah terdaftar di gudang ini. Gunakan fitur "Add Stock" untuk menambah jumlahnya.',
            ], 422);
        }

        $stokGudang = StokGudang::create($validated);
        $stokGudang->load('produk.kategori');

        return response()->json($stokGudang, 201);
    }

    // PUT /stok-gudang/{id} { stok }  -> menambah jumlah stok yang sudah ada
    public function update(Request $request, int $id): JsonResponse
    {
        $stokGudang = StokGudang::find($id);

        if (!$stokGudang) {
            return response()->json(['message' => 'Data stok tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'tambah' => 'required|integer|min:1',
        ]);

        $stokGudang->stok += $validated['tambah'];
        $stokGudang->save();
        $stokGudang->load('produk.kategori');

        return response()->json($stokGudang);
    }

    public function destroy(int $id): JsonResponse
    {
        $stokGudang = StokGudang::find($id);

        if (!$stokGudang) {
            return response()->json(['message' => 'Data stok tidak ditemukan'], 404);
        }

        $stokGudang->delete();

        return response()->json(['message' => 'Produk berhasil dihapus dari gudang']);
    }
}