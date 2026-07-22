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
        Schema::create('pilihan_jawaban', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('soal_id');
            $table->enum('pilihan', ['A', 'B', 'C', 'D', 'E']);
            $table->text('isi_jawaban');
            $table->boolean('benar')->default(false);
            $table->timestamps();

            $table->foreign('soal_id')
                ->references('id_soal')
                ->on('soal')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pilihan_jawaban');
    }
};
