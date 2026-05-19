<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recebimentos_materiais', function (Blueprint $table) {
            $table->id();
            $table->string('nome_abrigo');
            $table->string('municipio_uf');
            $table->string('orgao_responsavel');
            $table->date('data_recebimento');
            $table->time('hora_recebimento');
            $table->string('origem');
            $table->string('origem_outro')->nullable();
            $table->string('doador_nome');
            $table->string('doador_documento')->nullable();
            $table->string('doador_contato')->nullable();
            $table->boolean('conferido');
            $table->string('motivo_nao_conferido')->nullable();
            $table->boolean('possui_restricao');
            $table->text('restricao_descricao')->nullable();
            $table->string('destinacao_inicial');
            $table->string('local_armazenamento')->nullable();
            $table->string('recebido_por');
            $table->string('funcao_equipe')->nullable();
            $table->string('entregue_por')->nullable();
            $table->text('observacoes_gerais')->nullable();
            $table->timestamps();
        });

        Schema::create('recebimento_material_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recebimento_material_id')
                ->constrained('recebimentos_materiais')
                ->cascadeOnDelete();
            $table->foreignId('material_id')
                ->nullable()
                ->constrained('materiais')
                ->nullOnDelete();
            $table->string('categoria', 80);
            $table->string('descricao');
            $table->integer('quantidade');
            $table->string('unidade', 30);
            $table->string('condicao', 20);
            $table->text('observacoes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recebimento_material_itens');
        Schema::dropIfExists('recebimentos_materiais');
    }
};
