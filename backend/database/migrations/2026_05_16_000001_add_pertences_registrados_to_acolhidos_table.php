<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->text('pertences_registrados')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('acolhidos', function (Blueprint $table) {
            $table->dropColumn('pertences_registrados');
        });
    }
};
