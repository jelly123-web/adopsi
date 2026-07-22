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
        Schema::create('jawaban_siswa', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('hasil_ujian_id');
            $table->unsignedBigInteger('soal_id');
            $table->enum('pilihan_dipilih', ['A', 'B', 'C', 'D', 'E'])->nullable();
            $table->text('jawaban_essay')->nullable();
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
        Schema::dropIfExists('jawaban_siswa');
    }
};
