<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->withCount('pengguna as total_users')
            ->orderBy('nama')
            ->get();

        return response()->json($roles);
    }

    public function show(int $id): JsonResponse
    {
        $role = Role::withCount('pengguna as total_users')->find($id);

        if (!$role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        return response()->json($role);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:role,nama',
        ]);

        $role = Role::create($validated);
        $role->total_users = 0;

        return response()->json($role, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:255|unique:role,nama,' . $role->id,
        ]);

        $role->update($validated);
        $role->loadCount('pengguna as total_users');

        return response()->json($role);
    }

    public function destroy(int $id): JsonResponse
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role tidak ditemukan'], 404);
        }

        if ($role->pengguna()->count() > 0) {
            return response()->json([
                'message' => 'Role tidak bisa dihapus karena masih dipakai oleh user',
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role berhasil dihapus']);
    }
}