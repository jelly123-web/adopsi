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
        Schema::create('pets', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->unsignedBigInteger('kategori_id');
            $table->unsignedInteger('umur')->nullable();
            $table->string('jenis_kelamin', 20)->nullable();
            $table->string('ras')->nullable();
            $table->string('warna')->nullable();
            $table->decimal('berat', 8, 2)->nullable();
            $table->string('status')->default('tersedia');
            $table->text('deskripsi')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
