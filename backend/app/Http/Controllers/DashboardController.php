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
}