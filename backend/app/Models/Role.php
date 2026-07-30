<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $table = 'role';
    public $timestamps = false;

    protected $fillable = [
        'nama', // ✅ cuma ini yang ada di tabel
    ];

    public function pengguna(): HasMany
    {
        return $this->hasMany(Pengguna::class, 'role_id');
    }
}