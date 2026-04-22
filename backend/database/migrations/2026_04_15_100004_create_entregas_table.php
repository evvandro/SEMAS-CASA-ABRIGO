<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')
                ->constrained('materiais')
                ->restrictOnDelete();
            $table->foreignId('familia_id')
                ->nullable()
                ->constrained('familias')
                ->nullOnDelete();
            $table->foreignId('acolhido_id')
                ->nullable()
                ->constrained('acolhidos')
                ->nullOnDelete();
            $table->unsignedInteger('quantidade');
            $table->date('data_entrega');
            $table->text('observacoes')->nullable();
            $table->foreignId('entregue_por')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index('material_id');
            $table->index('familia_id');
            $table->index('acolhido_id');
            $table->index('data_entrega');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entregas');
    }
};
