<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use Illuminate\Http\Request;

class ProdukController extends Controller
{
    // ✅ Hanya select kolom yang dibutuhkan list, eager load kategori sekaligus (hindari N+1)
    public function index()
    {
        $produk = Produk::query()
            ->select('id', 'nama', 'thumbnail', 'harga', 'kategori_id', 'is_popular')
            ->with(['kategori:id,name'])
            ->orderByDesc('id')
            ->get();

        return response()->json($produk);
    }

    // Detail — boleh load semua kolom termasuk deskripsi
    public function show($id)
    {
        $produk = Produk::with('kategori:id,name')->findOrFail($id);
        return response()->json($produk);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama'        => 'required|string|max:255',
            'harga'       => 'required|numeric|min:0',
            'kategori_id' => 'required|integer|exists:kategori,id',
            'is_popular'  => 'boolean',
            'deskripsi'   => 'nullable|string',
            'thumbnail'   => 'nullable|string',
        ]);

        $produk = Produk::create($validated);

        return response()->json($produk->load('kategori:id,name'), 201);
    }

    public function update(Request $request, $id)
    {
        $produk = Produk::findOrFail($id);

        $validated = $request->validate([
            'nama'        => 'required|string|max:255',
            'harga'       => 'required|numeric|min:0',
            'kategori_id' => 'required|integer|exists:kategori,id',
            'is_popular'  => 'boolean',
            'deskripsi'   => 'nullable|string',
            'thumbnail'   => 'nullable|string',
        ]);

        $produk->update($validated);

        return response()->json($produk->load('kategori:id,name'));
    }

    public function destroy($id)
    {
        $produk = Produk::findOrFail($id);

        try {
            $produk->delete();
            return response()->json(['message' => 'Produk berhasil dihapus']);
        } catch (\Illuminate\Database\QueryException $e) {
            // Kode 23000 = foreign key constraint violation
            if ($e->getCode() === '23000') {
                return response()->json([
                    'message' => 'Produk tidak bisa dihapus karena masih memiliki data stok atau riwayat transaksi.',
                ], 422);
            }

            return response()->json([
                'message' => 'Gagal menghapus produk.',
            ], 500);
        }
    }
}
