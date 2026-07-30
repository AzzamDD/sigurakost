<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $table = 'produk';

    public $timestamps = false;

    protected $fillable = [
        'nama',
        'thumbnail',
        'deskripsi',
        'harga',
        'kategori_id',
        'is_popular',
    ];

    protected function casts(): array
    {
        return [
            'is_popular' => 'boolean',
            'harga' => 'integer',
        ];
    }

    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }
}