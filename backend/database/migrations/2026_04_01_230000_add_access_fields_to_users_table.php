<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('tecnico')->after('password')->index();
            $table->boolean('is_active')->default(true)->after('role')->index();
            $table->string('phone', 30)->nullable()->after('is_active');
            $table->string('documento', 14)->nullable()->unique()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['documento']);
            $table->dropColumn(['role', 'is_active', 'phone', 'documento']);
        });
    }
};
