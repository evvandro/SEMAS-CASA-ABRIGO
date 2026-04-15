<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('familias', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 12)->unique();
            $table->string('responsavel_nome')->nullable();
            $table->foreignId('setor_id')
                ->nullable()
                ->constrained('setores')
                ->nullOnDelete();
            $table->text('observacoes')->nullable();
            $table->date('data_entrada');
            $table->date('data_saida')->nullable();
            $table->string('tipo_saida', 80)->nullable();
            $table->timestamps();

            $table->index('setor_id');
            $table->index('data_saida');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('familias');
    }
};
