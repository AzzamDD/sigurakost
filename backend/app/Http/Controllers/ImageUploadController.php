<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class ImageUploadController extends Controller
{
    public function upload(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:2048',
                'folder' => 'nullable|string'
            ]);

            $file = $request->file('image');
            $supabaseUrl = rtrim(config('services.supabase.url'), '/');
            $serviceKey  = config('services.supabase.service_role_key');
            $bucket      = config('services.supabase.bucket', 'avatars');

            // Debug: cek apakah key terbaca
            if (empty($serviceKey)) {
                throw new \Exception('SUPABASE_SERVICE_ROLE_KEY masih kosong di .env');
            }
            if (empty($supabaseUrl)) {
                throw new \Exception('SUPABASE_URL belum diisi di .env');
            }

            $folder = $request->input('folder', 'kategori');
            $filename = $folder . '/' . Str::uuid() . '.' . $file->getClientOriginalExtension();

            $url = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$filename}";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$serviceKey}",
                'apikey' => $serviceKey,
                'Content-Type' => $file->getMimeType(),
                'x-upsert' => 'true',
            ])->send(
                'POST',
                $url,
                [
                    'body' => file_get_contents($file->getRealPath())
                ]
            );
            Log::info('Supabase Response', [
                'status' => $response->status(),
                'body'   => $response->body()
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Gagal upload ke Supabase Storage',
                    'status'  => $response->status(),
                    'error'   => $response->json() ?: $response->body()
                ], 500);
            }

            $publicUrl = "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$filename}";

            return response()->json([
                'message' => 'Upload berhasil',
                'url'     => $publicUrl
            ], 201);
        } catch (Throwable $e) {
            Log::error('Upload Image Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat upload',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal Server Error'
            ], 500);
        }
    }
}
