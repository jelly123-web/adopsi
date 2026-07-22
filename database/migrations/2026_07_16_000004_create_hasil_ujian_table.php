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
        Schema::create('hasil_ujian', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ujian_id');
            $table->unsignedBigInteger('siswa_id');
            $table->decimal('nilai', 5, 2)->default(0);
            $table->unsignedInteger('jumlah_benar')->default(0);
            $table->unsignedInteger('jumlah_salah')->default(0);
            $table->dateTime('waktu_mulai')->nullable();
            $table->dateTime('waktu_selesai')->nullable();
            $table->enum('status', ['Selesai', 'Belum'])->default('Belum');
            $table->timestamps();

            $table->foreign('ujian_id')
                ->references('id_ujian')
                ->on('ujian')
                ->cascadeOnDelete();
        });

        Schema::table('jawaban_siswa', function (Blueprint $table) {
            $table->foreign('hasil_ujian_id')
                ->references('id')
                ->on('hasil_ujian')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jawaban_siswa', function (Blueprint $table) {
            $table->dropForeign(['hasil_ujian_id']);
        });

        Schema::dropIfExists('hasil_ujian');
    }
};
