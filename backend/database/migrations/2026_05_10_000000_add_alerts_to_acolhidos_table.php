<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->boolean('pcd')->default(false)->after('observacoes');
            $table->boolean('gestante')->default(false)->after('pcd');
            $table->boolean('cronica')->default(false)->after('gestante');
            $table->boolean('idoso')->default(false)->after('cronica');
        });
    }

    public function down(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->dropColumn(['pcd', 'gestante', 'cronica', 'idoso']);
        });
    }
};
