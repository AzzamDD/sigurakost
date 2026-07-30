<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PhotoUploadController extends Controller
{
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:2048', // max 2MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'File tidak valid',
                'errors' => $validator->errors(),
            ], 422);
        }

        $pengguna = $request->user();
        $file = $request->file('photo');
        $extension = $file->getClientOriginalExtension();
        $filename = 'avatar_' . $pengguna->id . '_' . Str::random(8) . '.' . $extension;

        $supabaseUrl = config('services.supabase.url');
        $serviceKey = config('services.supabase.service_key');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $serviceKey,
            'apikey' => $serviceKey,
            'Content-Type' => $file->getMimeType(),
        ])->withBody(
            file_get_contents($file->getRealPath()),
            $file->getMimeType()
        )->post("{$supabaseUrl}/storage/v1/object/avatars/{$filename}");

        if (! $response->successful()) {
            return response()->json([
                'message' => 'Gagal upload ke storage',
                'detail' => $response->json(),
            ], 500);
        }

        $publicUrl = "{$supabaseUrl}/storage/v1/object/public/avatars/{$filename}";

        $pengguna->update(['foto' => $publicUrl]);

        return response()->json([
            'message' => 'Foto berhasil diupload',
            'url' => $publicUrl,
        ]);
    }
}