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
        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_item_measurement_id')->constrained('product_item_measurements')->onDelete('restrict');
            $table->foreignId('purchase_receipt_item_id')->constrained('purchase_receipt_items')->onDelete('cascade');
            $table->string('batch_number');
            $table->decimal('initial_quantity', 12, 4);
            $table->decimal('current_quantity', 12, 4);
            $table->decimal('unit_cost', 15, 2);
            $table->date('expired_date');
            $table->string('status')->default('Active');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_batches');
    }
};
