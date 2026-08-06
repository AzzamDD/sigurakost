<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailTransaksi extends Model
{
    protected $table = 'detail_transaksi';

    public $timestamps = false;

    protected $fillable = [
        'produk_id',
        'jumlah',
        'harga',
        'sub_total',
        'transaksi_id',
    ];

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class, 'transaksi_id');
    }
}