<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role', 'is_active', 'phone', 'documento'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_TECNICO = 'tecnico';

    public const ROLE_LOGISTICA = 'logistica';

    public const ROLE_SAUDE = 'saude';

    /**
     * @return array<int, string>
     */
    public static function roles(): array
    {
        return [
            self::ROLE_ADMIN,
            self::ROLE_TECNICO,
            self::ROLE_LOGISTICA,
            self::ROLE_SAUDE,
        ];
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function entregasRealizadas(): HasMany
    {
        return $this->hasMany(Entrega::class, 'entregue_por');
    }
}
