<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Toko extends Model
{
    protected $table = 'toko';

    protected $fillable = [
        'nama',
        'alamat',
        'foto',
        'no_hp',
        'operator_id',
    ];

    public function stokToko(): HasMany
    {
        return $this->hasMany(StokToko::class, 'toko_id');
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Pengguna::class, 'operator_id');
    }
}