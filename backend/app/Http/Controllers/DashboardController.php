<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Transaksi;
use App\Models\Merchant;

class DashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_user'     => User::count(),
            'total_order'    => Transaksi::count(),
            'total_merchant' => Merchant::count(),
        ]);
    }
}