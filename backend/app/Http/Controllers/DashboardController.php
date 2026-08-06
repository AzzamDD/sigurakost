<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pengguna;
use App\Models\Transaksi;
use App\Models\Toko;
use App\Models\Produk;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_user'     => Pengguna::count(),
            'total_order'    => Transaksi::count(),
            'total_merchant' => Toko::count(),
            'total_produk'   => Produk::count(),
        ]);
    }

    // ✅ Endpoint baru untuk latest transactions di dashboard
    public function latestTransactions(Request $request)
    {
        $isAdmin = trim(strtolower($request->user()->role?->nama ?? '')) === 'admin';

        $query = Transaksi::with([
            'detailTransaksi.produk.kategori',
            'toko',
            'pengguna',
        ])->orderBy('id', 'desc')->limit(5);

        if (!$isAdmin) {
            $toko = Toko::where('operator_id', $request->user()->id)->first();
            if (!$toko) {
                // Kasir tanpa toko → kembalikan array kosong, bukan error
                return response()->json([]);
            }
            $query->where('toko_id', $toko->id);
        }

        return response()->json($query->get());
    }
}