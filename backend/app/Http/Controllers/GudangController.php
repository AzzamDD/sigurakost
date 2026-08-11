<?php

namespace App\Http\Controllers;

use App\Models\Gudang;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GudangController extends Controller
{
    public function index(): JsonResponse
    {
        $gudang = Gudang::withCount('stokGudang as produk_count')->get();

        return response()->json($gudang);
    }

    public function show(int $id): JsonResponse
    {
        $gudang = Gudang::with(['stokGudang.produk.kategori'])->find($id);

        if (!$gudang) {
            return response()->json(['message' => 'Gudang tidak ditemukan'], 404);
        }

        return response()->json($gudang);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'alamat' => 'nullable|string',
            'foto' => 'nullable|string',
            'no_hp' => 'nullable|string|max:30',
        ]);

        $gudang = Gudang::create($validated);

        return response()->json($gudang, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $gudang = Gudang::find($id);

        if (!$gudang) {
            return response()->json(['message' => 'Gudang tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'alamat' => 'nullable|string',
            'foto' => 'nullable|string',
            'no_hp' => 'nullable|string|max:30',
        ]);

        $gudang->update($validated);

        return response()->json($gudang);
    }

    public function destroy(int $id): JsonResponse
    {
        $gudang = Gudang::find($id);

        if (!$gudang) {
            return response()->json(['message' => 'Gudang tidak ditemukan'], 404);
        }

        $gudang->delete();

        return response()->json(['message' => 'Gudang berhasil dihapus']);
    }
}