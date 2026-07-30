<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    public function updateProfile(Request $request)
    {
        $pengguna = $request->user();

        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:pengguna,email,' . $pengguna->id,
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        $pengguna->update($request->only(['nama', 'email', 'no_hp', 'foto']));

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $pengguna,
        ]);
    }

    public function changePassword(Request $request)
    {
        $pengguna = $request->user();

        $validator = Validator::make($request->all(), [
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (! Hash::check($request->old_password, $pengguna->password)) {
            return response()->json([
                'message' => 'Password lama salah',
            ], 401);
        }

        $pengguna->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah',
        ]);
    }
}