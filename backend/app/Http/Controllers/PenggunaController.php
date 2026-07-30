<?php

namespace App\Http\Controllers;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PenggunaController extends Controller
{
    public function index(): JsonResponse
    {
        $pengguna = Pengguna::query()
            ->select('id', 'nama', 'email', 'foto', 'no_hp', 'role_id')
            ->with('role:id,nama')
            ->orderBy('nama')
            ->get();

        return response()->json($pengguna);
    }

    public function show(int $id): JsonResponse
    {
        $pengguna = Pengguna::select('id', 'nama', 'email', 'foto', 'no_hp', 'role_id')
            ->with('role:id,nama')
            ->find($id);

        if (!$pengguna) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        return response()->json($pengguna);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama'     => 'required|string|max:150',
            'email'    => 'required|email|max:150|unique:pengguna,email',
            'no_hp'    => 'nullable|string|max:30',
            'foto'     => 'nullable|string',
            'role_id'  => 'nullable|exists:role,id',
            'password' => 'required|string|min:6',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $pengguna = Pengguna::create($validated);
        $pengguna->load('role:id,nama');

        return response()->json($pengguna, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $pengguna = Pengguna::find($id);

        if (!$pengguna) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'nama'     => 'required|string|max:150',
            'email'    => [
                'required',
                'email',
                'max:150',
                Rule::unique('pengguna', 'email')->ignore($pengguna->id),
            ],
            'no_hp'    => 'nullable|string|max:30',
            'foto'     => 'nullable|string',
            'role_id'  => 'nullable|exists:role,id',
            'password' => 'nullable|string|min:6', // ✅ opsional saat edit
        ]);

        // ✅ Kalau password dikosongkan, jangan diupdate — biar password lama tetap aman
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $pengguna->update($validated);
        $pengguna->load('role:id,nama');

        return response()->json($pengguna);
    }

    public function destroy(int $id): JsonResponse
    {
        $pengguna = Pengguna::find($id);

        if (!$pengguna) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        // ✅ Cegah hapus user yang masih jadi keeper di toko manapun
        if ($pengguna->tokoDiurus()->count() > 0) {
            return response()->json([
                'message' => 'User tidak bisa dihapus karena masih menjadi keeper di salah satu toko',
            ], 422);
        }

        $pengguna->delete();

        return response()->json(['message' => 'User berhasil dihapus']);
    }
}