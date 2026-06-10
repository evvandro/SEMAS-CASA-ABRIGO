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
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->string('parentesco', 100)->nullable()->after('familia_id');
            $table->string('cpf', 20)->nullable()->change();
            $table->time('hora_saida')->nullable();
            $table->string('destino_informado')->nullable();
            $table->string('endereco_destino')->nullable();
            $table->string('municipio_destino')->nullable();
            $table->string('telefone_destino')->nullable();
            $table->json('encaminhamentos_rede')->nullable();
            $table->text('resumo_encaminhamento')->nullable();
            $table->string('condicao_saida')->nullable();
            $table->text('observacoes_tecnicas')->nullable();
            $table->string('responsavel_desligamento')->nullable();
            $table->string('cargo_responsavel')->nullable();
        });

        Schema::table('familias', function (Blueprint $table) {
            $table->time('hora_saida')->nullable();
            $table->string('destino_informado')->nullable();
            $table->string('endereco_destino')->nullable();
            $table->string('municipio_destino')->nullable();
            $table->string('telefone_destino')->nullable();
            $table->json('encaminhamentos_rede')->nullable();
            $table->text('resumo_encaminhamento')->nullable();
            $table->string('condicao_saida')->nullable();
            $table->text('observacoes_tecnicas')->nullable();
            $table->string('responsavel_desligamento')->nullable();
            $table->string('cargo_responsavel')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->dropColumn([
                'parentesco', 'hora_saida', 'destino_informado', 'endereco_destino',
                'municipio_destino', 'telefone_destino', 'encaminhamentos_rede',
                'resumo_encaminhamento', 'condicao_saida', 'observacoes_tecnicas',
                'responsavel_desligamento', 'cargo_responsavel',
            ]);
        });

        Schema::table('familias', function (Blueprint $table) {
            $table->dropColumn([
                'hora_saida', 'destino_informado', 'endereco_destino',
                'municipio_destino', 'telefone_destino', 'encaminhamentos_rede',
                'resumo_encaminhamento', 'condicao_saida', 'observacoes_tecnicas',
                'responsavel_desligamento', 'cargo_responsavel',
            ]);
        });
    }
};
