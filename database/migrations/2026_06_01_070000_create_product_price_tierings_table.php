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
        Schema::create('product_price_tierings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_item_measurement_id')
                ->constrained('product_item_measurements')
                ->onDelete('cascade');
            $table->integer('minimum')->default(1);
            $table->decimal('price', 15, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_price_tierings');
    }
};
