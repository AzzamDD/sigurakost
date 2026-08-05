<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user || !$user->role) {
            return response()->json([
                'message' => 'Akun ini belum punya role. Hubungi admin.',
            ], 403);
        }

        if (!in_array($user->role->nama, $roles)) {
            return response()->json([
                'message' => 'Anda tidak punya akses untuk aksi ini.',
            ], 403);
        }

        return $next($request);
    }
}