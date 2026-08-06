<?php

namespace App\Http\Controllers;

use App\Models\Pengguna;
use App\Models\Toko;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class PenggunaController extends Controller
{
    public function index()
    {
        $pengguna = Pengguna::with(['role', 'toko'])->get();
        return response()->json($pengguna);
    }

    public function show($id)
    {
        $pengguna = Pengguna::with(['role', 'toko'])->findOrFail($id);
        return response()->json($pengguna);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:150',
            'email' => 'required|email|unique:pengguna,email',
            'password' => 'required|string|min:6',
            'no_hp' => 'nullable|string|max:20',
            'role_id' => 'nullable|exists:role,id',
            'toko_id' => 'nullable|exists:toko,id',
        ]);

        return DB::transaction(function () use ($request) {
            $pengguna = Pengguna::create([
                'nama' => $request->nama,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'foto' => $request->foto,
                'no_hp' => $request->no_hp,
                'role_id' => $request->role_id,
            ]);

            if ($request->filled('toko_id')) {
                // Lepas penjaga lama di toko tersebut jika ada
                Toko::where('id', $request->toko_id)->update(['operator_id' => $pengguna->id]);
            }

            return response()->json($pengguna->load(['role', 'toko']), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $pengguna = Pengguna::findOrFail($id);

        $request->validate([
            'nama' => 'required|string|max:150',
            'email' => "required|email|unique:pengguna,email,{$id}",
            'no_hp' => 'nullable|string|max:20',
            'role_id' => 'nullable|exists:role,id',
            'toko_id' => 'nullable',
        ]);

        return DB::transaction(function () use ($request, $pengguna) {
            $data = [
                'nama' => $request->nama,
                'email' => $request->email,
                'foto' => $request->foto,
                'no_hp' => $request->no_hp,
                'role_id' => $request->role_id,
            ];

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $pengguna->update($data);

            // Lepas toko lama jika pernah di-assign
            Toko::where('operator_id', $pengguna->id)->update(['operator_id' => null]);

            // Pasang toko baru jika dipilih
            if ($request->filled('toko_id')) {
                Toko::where('id', $request->toko_id)->update(['operator_id' => $pengguna->id]);
            }

            return response()->json($pengguna->load(['role', 'toko']));
        });
    }

    public function destroy($id)
    {
        $pengguna = Pengguna::findOrFail($id);
        Toko::where('operator_id', $pengguna->id)->update(['operator_id' => null]);
        $pengguna->delete();

        return response()->json(['message' => 'Pengguna berhasil dihapus']);
    }
}