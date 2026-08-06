<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PhotoUploadController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\GudangController;
use App\Http\Controllers\StokGudangController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\TokoController;
use App\Http\Controllers\StokTokoController;
use App\Http\Controllers\PenggunaController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthPasswordController;
use App\Http\Controllers\TransaksiController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/upload/image', [UploadController::class, 'image']);
Route::post('/forgot-password', [AuthPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [AuthPasswordController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    Route::put('/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/photo', [PhotoUploadController::class, 'upload']);

    Route::get('/kategori', [KategoriController::class, 'index']);
    Route::get('/kategori/{id}', [KategoriController::class, 'show']);
    Route::post('/kategori', [KategoriController::class, 'store']);
    Route::put('/kategori/{id}', [KategoriController::class, 'update']);
    Route::delete('/kategori/{id}', [KategoriController::class, 'destroy']);

    Route::get('/produk', [ProdukController::class, 'index']);
    Route::get('/produk/{id}', [ProdukController::class, 'show']);
    Route::post('/produk', [ProdukController::class, 'store']);
    Route::put('/produk/{id}', [ProdukController::class, 'update']);
    Route::delete('/produk/{id}', [ProdukController::class, 'destroy']);

    Route::get('/gudang', [GudangController::class, 'index']);
    Route::get('/gudang/{id}', [GudangController::class, 'show']);
    Route::post('/gudang', [GudangController::class, 'store']);
    Route::put('/gudang/{id}', [GudangController::class, 'update']);
    Route::delete('/gudang/{id}', [GudangController::class, 'destroy']);

    Route::get('/stok-gudang', [StokGudangController::class, 'index']);
    Route::post('/stok-gudang', [StokGudangController::class, 'store']);
    Route::put('/stok-gudang/{id}', [StokGudangController::class, 'update']);
    Route::delete('/stok-gudang/{id}', [StokGudangController::class, 'destroy']);

    Route::get('/toko', [TokoController::class, 'index']);
    Route::get('/toko/{id}', [TokoController::class, 'show']);
    Route::post('/toko', [TokoController::class, 'store']);
    Route::put('/toko/{id}', [TokoController::class, 'update']);
    Route::delete('/toko/{id}', [TokoController::class, 'destroy']);

    Route::get('/stok-toko', [StokTokoController::class, 'index']);
    Route::post('/stok-toko', [StokTokoController::class, 'store']);
    Route::put('/stok-toko/{id}', [StokTokoController::class, 'update']);
    Route::delete('/stok-toko/{id}', [StokTokoController::class, 'destroy']);

    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::get('/transaksi', [TransaksiController::class, 'index']);
    Route::get('/transaksi/{id}', [TransaksiController::class, 'show']);
    Route::post('/transaksi', [TransaksiController::class, 'store']);

    // 🔒 KHUSUS ADMIN SAJA
    Route::middleware('role:admin')->group(function () {
        Route::delete('/transaksi/{id}', [TransaksiController::class, 'destroy']);

        Route::get('/role', [RoleController::class, 'index']);
        Route::get('/role/{id}', [RoleController::class, 'show']);
        Route::post('/role', [RoleController::class, 'store']);
        Route::put('/role/{id}', [RoleController::class, 'update']);
        Route::delete('/role/{id}', [RoleController::class, 'destroy']);

        Route::get('/pengguna', [PenggunaController::class, 'index']);
        Route::get('/pengguna/{id}', [PenggunaController::class, 'show']);
        Route::post('/pengguna', [PenggunaController::class, 'store']);
        Route::put('/pengguna/{id}', [PenggunaController::class, 'update']);
        Route::delete('/pengguna/{id}', [PenggunaController::class, 'destroy']);
    });
});
