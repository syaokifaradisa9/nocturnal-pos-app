<?php

use App\Models\Business;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\ProductItem;
use App\Services\ProductCatalogService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->business = Business::create([
        'name' => 'Test Business',
        'user_id' => null,
    ]);

    // Create some measurement units / product units
    $this->pcs = ProductUnit::create([
        'name' => 'Pieces',
        'short_name' => 'Pcs',
        'description' => 'Individual items',
        'allow_decimal' => false,
        'business_id' => $this->business->id,
    ]);

    $this->box = ProductUnit::create([
        'name' => 'Box',
        'short_name' => 'Box',
        'description' => 'Box of 12 pcs',
        'allow_decimal' => false,
        'business_id' => $this->business->id,
    ]);

    $this->service = app(ProductCatalogService::class);
});

test('storeProduct successfully saves product and items, overriding base unit conversion rate to 1', function () {
    $payload = [
        'name' => 'Fresh Milk',
        'items' => [
            [
                'measurement_unit_id' => $this->pcs->id,
                'is_base_unit' => true,
                'conversion_rate' => 12.5, // Should be overridden to 1.0000
                'is_active' => true,
            ],
            [
                'measurement_unit_id' => $this->box->id,
                'is_base_unit' => false,
                'conversion_rate' => 12.0000,
                'is_active' => true,
            ],
        ],
    ];

    $product = $this->service->storeProduct($payload);

    expect($product)->toBeInstanceOf(Product::class);
    expect($product->name)->toBe('Fresh Milk');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Fresh Milk',
    ]);

    $this->assertDatabaseHas('product_items', [
        'product_id' => $product->id,
        'measurement_unit_id' => $this->pcs->id,
        'is_base_unit' => true,
        'conversion_rate' => 1.0000, // Overridden to 1
    ]);

    $this->assertDatabaseHas('product_items', [
        'product_id' => $product->id,
        'measurement_unit_id' => $this->box->id,
        'is_base_unit' => false,
        'conversion_rate' => 12.0000,
    ]);
});

test('storeProduct throws exception when there are zero base units', function () {
    $payload = [
        'name' => 'Fresh Milk',
        'items' => [
            [
                'measurement_unit_id' => $this->pcs->id,
                'is_base_unit' => false,
                'conversion_rate' => 1.0000,
            ],
            [
                'measurement_unit_id' => $this->box->id,
                'is_base_unit' => false,
                'conversion_rate' => 12.0000,
            ],
        ],
    ];

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('A product must have exactly one base unit.');

    $this->service->storeProduct($payload);
});

test('storeProduct throws exception when there are multiple base units', function () {
    $payload = [
        'name' => 'Fresh Milk',
        'items' => [
            [
                'measurement_unit_id' => $this->pcs->id,
                'is_base_unit' => true,
                'conversion_rate' => 1.0000,
            ],
            [
                'measurement_unit_id' => $this->box->id,
                'is_base_unit' => true,
                'conversion_rate' => 1.0000,
            ],
        ],
    ];

    $this->expectException(\InvalidArgumentException::class);
    $this->expectExceptionMessage('A product must have exactly one base unit.');

    $this->service->storeProduct($payload);
});

test('storeProduct transaction rolls back database modifications on validation failure', function () {
    $payload = [
        'name' => 'Failing Product',
        'items' => [
            [
                'measurement_unit_id' => $this->pcs->id,
                'is_base_unit' => true,
                'conversion_rate' => 1.0000,
            ],
            [
                'measurement_unit_id' => 99999, // Non-existent unit to cause foreign key failure
                'is_base_unit' => false,
                'conversion_rate' => 12.0000,
            ],
        ],
    ];

    try {
        $this->service->storeProduct($payload);
    } catch (\Exception $e) {
        // Expected database query / foreign key exception
    }

    // Verify product is not created (rollback)
    $this->assertDatabaseMissing('products', [
        'name' => 'Failing Product',
    ]);
});
