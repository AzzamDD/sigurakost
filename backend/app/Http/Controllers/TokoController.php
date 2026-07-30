<?php

namespace App\Http\Controllers;

use App\Models\Toko;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TokoController extends Controller
{
    public function index(): JsonResponse
    {
        $toko = Toko::withCount('stokToko')
            ->with('operator:id,nama,foto,no_hp') // ✅ tambah select field biar gak bawa password
            ->get();

        return response()->json($toko);
    }

    public function show(int $id): JsonResponse
    {
        $toko = Toko::with([
            'stokToko.produk.kategori',
            'operator:id,nama,foto,no_hp', // ✅ sama
        ])->find($id);

        if (!$toko) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 404);
        }

        return response()->json($toko);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama'        => 'required|string|max:150',
            'alamat'      => 'nullable|string',
            'foto'        => 'nullable|string',
            'no_hp'       => 'nullable|string|max:30',
            'operator_id' => 'nullable|exists:pengguna,id', // ✅ tetap, validated ke tabel pengguna
        ]);

        $toko = Toko::create($validated);

        // Load operator setelah create biar response konsisten
        $toko->load('operator:id,nama,foto,no_hp');

        return response()->json($toko, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $toko = Toko::find($id);

        if (!$toko) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'nama'        => 'required|string|max:150',
            'alamat'      => 'nullable|string',
            'foto'        => 'nullable|string',
            'no_hp'       => 'nullable|string|max:30',
            'operator_id' => 'nullable|exists:pengguna,id',
        ]);

        $toko->update($validated);

        // Reload biar relasi ter-refresh setelah update operator_id
        $toko->load('operator:id,nama,foto,no_hp');

        return response()->json($toko);
    }

    public function destroy(int $id): JsonResponse
    {
        $toko = Toko::find($id);

        if (!$toko) {
            return response()->json(['message' => 'Toko tidak ditemukan'], 404);
        }

        $toko->delete();

        return response()->json(['message' => 'Toko berhasil dihapus']);
    }
}