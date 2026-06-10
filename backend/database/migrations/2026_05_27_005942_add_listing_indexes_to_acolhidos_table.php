<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->index(['data_saida', 'setor_id', 'nome'], 'acolhidos_ativos_setor_nome_idx');
            $table->index(['data_saida', 'data_entrada'], 'acolhidos_ativos_entrada_idx');
            $table->index('cpf', 'acolhidos_cpf_idx');
        });
    }

    public function down(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->dropIndex('acolhidos_ativos_setor_nome_idx');
            $table->dropIndex('acolhidos_ativos_entrada_idx');
            $table->dropIndex('acolhidos_cpf_idx');
        });
    }
};