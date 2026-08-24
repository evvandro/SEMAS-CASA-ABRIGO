<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->index('data_entrada', 'acolhidos_data_entrada_idx');
        });

        Schema::table('recebimentos_materiais', function (Blueprint $table) {
            $table->index('data_recebimento', 'recebimentos_data_recebimento_idx');
        });
    }

    public function down(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->dropIndex('acolhidos_data_entrada_idx');
        });

        Schema::table('recebimentos_materiais', function (Blueprint $table) {
            $table->dropIndex('recebimentos_data_recebimento_idx');
        });
    }
};
