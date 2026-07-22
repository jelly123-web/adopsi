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
        Schema::create('soal', function (Blueprint $table) {
            $table->id('id_soal');
            $table->unsignedBigInteger('ujian_id');
            $table->text('pertanyaan');
            $table->enum('tipe_soal', ['PG', 'Essay']);
            $table->unsignedInteger('bobot');
            $table->timestamps();

            $table->foreign('ujian_id')
                ->references('id_ujian')
                ->on('ujian')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('soal');
    }
};
