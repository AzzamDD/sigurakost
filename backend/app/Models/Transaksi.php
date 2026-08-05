<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $table = 'transaksi';

    // Tabel gak punya created_at/updated_at -> WAJIB false,
    // kalau lupa bakal error "column created_at does not exist" pas save().
    public $timestamps = false;

    protected $fillable = [
        'nama_pelanggan',
        'no_hp',
        'sub_total',
        'pajak',
        'total_bayar',
        'toko_id',
        'pengguna_id',
    ];

    public function detailTransaksi()
    {
        return $this->hasMany(DetailTransaksi::class, 'transaksi_id');
    }

    public function toko()
    {
        return $this->belongsTo(Toko::class, 'toko_id');
    }

    public function pengguna()
    {
        return $this->belongsTo(Pengguna::class, 'pengguna_id');
    }
}