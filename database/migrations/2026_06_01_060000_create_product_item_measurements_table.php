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
        Schema::create('product_item_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_item_id')->constrained('product_items')->onDelete('cascade');
            $table->foreignId('measurement_unit_id')->constrained('product_units')->onDelete('restrict');
            $table->foreignId('target_measurement_unit_id')->nullable()->constrained('product_units')->onDelete('restrict');
            $table->boolean('is_base_unit')->default(false);
            $table->decimal('conversion_rate', 10, 4)->default(1.0000);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_item_measurements');
    }
};
