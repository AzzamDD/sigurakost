<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'pengguna'; // pakai tabel pengguna

    protected $primaryKey = 'id'; // sesuaikan kalau primary key beda, misal 'id_pengguna'

    public $timestamps = false; // matikan kalau tabel pengguna tidak ada created_at/updated_at

    protected $fillable = [
        'nama',
        'email',
        'password',
        'role',
    ]; // sesuaikan dengan kolom asli

    protected $hidden = [
        'password',
    ];
}