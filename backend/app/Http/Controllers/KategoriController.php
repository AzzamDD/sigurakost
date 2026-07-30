<?php

namespace App\Http\Controllers;

use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;


class KategoriController extends Controller
{
    public function index()
    {
        $kategori = \App\Models\Kategori::query()
            ->select('id', 'name', 'tagline', 'foto')
            ->withCount('produk as produk_count')
            ->orderBy('name')
            ->get();
        return response()->json($kategori);
    }

    public function show($id)
    {
        $kategori = Kategori::find($id);
        if (!$kategori) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }
        return response()->json($kategori);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'    => 'required|string|max:255',
                'tagline' => 'nullable|string|max:255',
                'foto'    => 'nullable|string',
            ]);

            $kategori = Kategori::create([
                'name'    => $validated['name'],
                'tagline' => $validated['tagline'] ?? null,
                'foto'    => $validated['foto'] ?? null,
            ]);

            return response()->json([
                'message' => 'Kategori berhasil ditambahkan',
                'kategori' => $kategori,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Kategori Store Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menyimpan kategori',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $kategori = Kategori::find($id);
        if (!$kategori) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        try {
            $validated = $request->validate([
                'name'    => 'required|string|max:255',
                'tagline' => 'nullable|string|max:255',
                'foto'    => 'nullable|string',
            ]);

            $kategori->update($validated);

            return response()->json([
                'message' => 'Kategori berhasil diperbarui',
                'kategori' => $kategori,
            ]);
        } catch (\Exception $e) {
            Log::error('Kategori Update Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memperbarui kategori',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $kategori = Kategori::find($id);
        if (!$kategori) {
            return response()->json(['message' => 'Kategori tidak ditemukan'], 404);
        }

        $kategori->delete();
        return response()->json(['message' => 'Kategori berhasil dihapus']);
    }
}
