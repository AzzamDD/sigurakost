<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gudang extends Model
{
    protected $table = 'gudang';

    public $timestamps = false; 

    protected $fillable = [
        'nama',
        'alamat',
        'foto',
        'no_hp',
    ];

    public function stokGudang(): HasMany
    {
        return $this->hasMany(StokGudang::class, 'gudang_id');
    }
}