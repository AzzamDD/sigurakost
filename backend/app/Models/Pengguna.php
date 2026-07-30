<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Pengguna extends Authenticatable
{
    use HasApiTokens;

    protected $table = 'pengguna';
    public $timestamps = false;

    protected $fillable = [
        'nama',
        'email',
        'password',
        'foto',
        'no_hp',
        'role_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // ✅ ditambahkan — buat cek sebelum user dihapus (dipakai di destroy())
    public function tokoDiurus(): HasMany
    {
        return $this->hasMany(Toko::class, 'operator_id');
    }
}