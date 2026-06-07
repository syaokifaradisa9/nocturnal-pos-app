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
        Schema::table('transaction_item', function (Blueprint $table) {
            $table->dropForeign(['product_item_id']);
            $table->dropColumn('product_item_id');

            $table->string('product_name')->after('transaction_id');
            $table->string('measurement_name')->after('product_name');
            $table->foreignId('product_item_measurement_id')->nullable()->after('measurement_name')->constrained('product_item_measurements')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_item', function (Blueprint $table) {
            $table->dropForeign(['product_item_measurement_id']);
            $table->dropColumn('product_item_measurement_id');
            $table->dropColumn('measurement_name');
            $table->dropColumn('product_name');

            $table->foreignId('product_item_id')->constrained('product_items')->onDelete('restrict');
        });
    }
};
