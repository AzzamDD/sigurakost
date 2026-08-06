<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Pengguna; // 👈 PASTIKAN INI ADA

class Role extends Model
{
    protected $table = 'role';

    public $timestamps = false;

    protected $fillable = [
        'nama',
    ];

    // Relasi untuk menghitung total_users
    public function pengguna(): HasMany
    {
        // Pastikan file model user Anda namanya Pengguna.php
        // Kalau namanya User.php, ganti jadi User::class
        return $this->hasMany(Pengguna::class, 'role_id'); 
    }
}