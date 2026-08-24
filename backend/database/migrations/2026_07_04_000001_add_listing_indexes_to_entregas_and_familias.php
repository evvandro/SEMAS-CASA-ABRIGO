<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            // Suporta a ordenação estável da listagem paginada (data_entrega DESC, id DESC).
            $table->index(['data_entrega', 'id'], 'entregas_data_id_idx');
        });

        Schema::table('familias', function (Blueprint $table) {
            $table->index(['data_saida', 'responsavel_nome'], 'familias_ativas_resp_idx');
        });
    }

    public function down(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->dropIndex('entregas_data_id_idx');
        });

        Schema::table('familias', function (Blueprint $table) {
            $table->dropIndex('familias_ativas_resp_idx');
        });
    }
};
