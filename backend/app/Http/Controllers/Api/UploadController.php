<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class UploadController extends Controller
{
    public function image(Request $request)
    {
        $validated = $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp,gif',
                'max:2048',
            ],
            'folder' => [
                'nullable',
                'string',
                'max:100',
            ],
        ]);

        try {
            $supabaseUrl = rtrim(
                (string) config('services.supabase.url'),
                '/'
            );

            $serviceRoleKey = (string) config(
                'services.supabase.service_role_key'
            );

            $bucket = (string) config(
                'services.supabase.bucket'
            );

            if ($supabaseUrl === '') {
                throw new \RuntimeException('SUPABASE_URL belum dikonfigurasi.');
            }

            if ($serviceRoleKey === '') {
                throw new \RuntimeException(
                    'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.'
                );
            }

            if ($bucket === '') {
                throw new \RuntimeException(
                    'SUPABASE_STORAGE_BUCKET belum dikonfigurasi.'
                );
            }

            $file = $request->file('image');

            if (!$file || !$file->isValid()) {
                return response()->json([
                    'message' => 'File gambar tidak valid.',
                ], 422);
            }

            $folder = $validated['folder'] ?? 'kategori';

            // Hanya izinkan huruf, angka, underscore, strip, dan slash.
            $folder = preg_replace(
                '/[^A-Za-z0-9_\/-]/',
                '',
                $folder
            );

            $folder = trim($folder ?: 'kategori', '/');

            $extension = strtolower(
                $file->getClientOriginalExtension()
                ?: $file->extension()
                ?: 'jpg'
            );

            $fileName = Str::uuid()->toString() . '.' . $extension;
            $storagePath = $folder . '/' . $fileName;

            // Encode setiap segmen path tanpa menghilangkan slash.
            $encodedPath = implode(
                '/',
                array_map(
                    'rawurlencode',
                    explode('/', $storagePath)
                )
            );

            $uploadUrl =
                $supabaseUrl .
                '/storage/v1/object/' .
                rawurlencode($bucket) .
                '/' .
                $encodedPath;

            $mimeType = $file->getMimeType() ?: 'application/octet-stream';
            $fileContent = file_get_contents($file->getRealPath());

            if ($fileContent === false) {
                throw new \RuntimeException(
                    'Gagal membaca isi file yang akan diupload.'
                );
            }

            $response = Http::timeout(60)
                ->withHeaders([
                    'apikey' => $serviceRoleKey,
                    'Authorization' => 'Bearer ' . $serviceRoleKey,
                    'Content-Type' => $mimeType,
                    'x-upsert' => 'false',
                ])
                ->withBody($fileContent, $mimeType)
                ->post($uploadUrl);

            if (!$response->successful()) {
                Log::error('Supabase Storage upload gagal', [
                    'status' => $response->status(),
                    'response' => $response->body(),
                    'upload_url' => $uploadUrl,
                    'bucket' => $bucket,
                    'path' => $storagePath,
                ]);

                return response()->json([
                    'message' => 'Gagal upload ke Supabase Storage.',
                    'supabase_status' => $response->status(),
                    'supabase_error' => $response->json()
                        ?: $response->body(),
                ], 500);
            }

            // URL ini hanya dapat dibuka langsung jika bucket bersifat public.
            $publicUrl =
                $supabaseUrl .
                '/storage/v1/object/public/' .
                rawurlencode($bucket) .
                '/' .
                $encodedPath;

            return response()->json([
                'message' => 'Foto berhasil diupload.',
                'url' => $publicUrl,
                'path' => $storagePath,
                'bucket' => $bucket,
            ], 201);
        } catch (Throwable $exception) {
            Log::error('Upload image exception', [
                'message' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat upload foto.',
                'error' => config('app.debug')
                    ? $exception->getMessage()
                    : null,
            ], 500);
        }
    }
}