<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->uuid('grupo_entrega')->nullable()->after('id');
            $table->string('destino_tipo', 20)->nullable()->after('acolhido_id');
            $table->string('externo_nome')->nullable()->after('destino_tipo');
            $table->string('externo_documento', 40)->nullable()->after('externo_nome');
            $table->string('externo_contato', 80)->nullable()->after('externo_documento');
            $table->string('externo_instituicao')->nullable()->after('externo_contato');
            $table->string('finalidade', 120)->nullable()->after('data_entrega');

            $table->index('grupo_entrega');
            $table->index('destino_tipo');
        });
    }

    public function down(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->dropIndex(['grupo_entrega']);
            $table->dropIndex(['destino_tipo']);
            $table->dropColumn([
                'grupo_entrega',
                'destino_tipo',
                'externo_nome',
                'externo_documento',
                'externo_contato',
                'externo_instituicao',
                'finalidade',
            ]);
        });
    }
};
