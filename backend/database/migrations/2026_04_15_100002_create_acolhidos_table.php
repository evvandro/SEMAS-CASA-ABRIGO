<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acolhidos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_pulseira', 8)->unique();
            $table->foreignId('familia_id')
                ->nullable()
                ->constrained('familias')
                ->nullOnDelete();
            $table->foreignId('setor_id')
                ->nullable()
                ->constrained('setores')
                ->nullOnDelete();
            $table->string('nome');
            $table->date('data_nascimento')->nullable();
            $table->string('cpf', 20)->nullable();
            $table->string('telefone', 20)->nullable();
            $table->string('genero', 30)->nullable();
            $table->string('leito', 30)->nullable();
            $table->text('observacoes')->nullable();
            $table->date('data_entrada');
            $table->date('data_saida')->nullable();
            $table->string('tipo_saida', 80)->nullable();
            $table->timestamps();

            $table->index('familia_id');
            $table->index('setor_id');
            $table->index('data_saida');
            $table->index('nome');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acolhidos');
    }
};
