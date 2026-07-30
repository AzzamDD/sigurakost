<?php

namespace App\Http\Controllers;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthPasswordController extends Controller
{
    /**
     * POST /api/forgot-password
     * Body: { email: string }
     */
    public function sendResetLink(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Email tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        $pengguna = Pengguna::where('email', $request->email)->first();

        // PENTING: jangan bocorin apakah email terdaftar atau nggak
        // demi keamanan (enumeration attack). Response selalu sama.
        if (!$pengguna) {
            return response()->json([
                'message' => 'Jika email terdaftar, link reset sudah dikirim.',
            ], 200);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $pengguna->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $resetUrl = config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($pengguna->email);

        // Kirim email — sesuaikan Mailable-nya, ini contoh minimal pakai Mail::raw dulu
        Mail::raw("Klik link ini buat reset password kamu: {$resetUrl}\n\nLink berlaku 60 menit.", function ($message) use ($pengguna) {
            $message->to($pengguna->email)
                ->subject('Reset Password - SiguraKost');
        });

        return response()->json([
            'message' => 'Jika email terdaftar, link reset sudah dikirim.',
        ], 200);
    }

    /**
     * POST /api/reset-password
     * Body: { email, token, password, password_confirmation }
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Token tidak ditemukan atau sudah kedaluwarsa'], 400);
        }

        // Token expired setelah 60 menit
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Token sudah kedaluwarsa'], 400);
        }

        if (!Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Token tidak valid'], 400);
        }

        $pengguna = Pengguna::where('email', $request->email)->first();
        if (!$pengguna) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $pengguna->password = Hash::make($request->password);
        $pengguna->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset'], 200);
    }
}