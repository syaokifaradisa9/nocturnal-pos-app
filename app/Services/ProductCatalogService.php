<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductItem;
use Illuminate\Support\Facades\DB;

class ProductCatalogService
{
    /**
     * Store a product and its units atomically.
     *
     * @param array $payload
     * @return Product
     * @throws \InvalidArgumentException
     */
    public function storeProduct(array $payload): Product
    {
        $items = $payload['items'] ?? [];
        if (!is_array($items) || empty($items)) {
            throw new \InvalidArgumentException('Product must have at least one unit item.');
        }

        // Count how many base units are present in the payload
        $baseUnitCount = 0;
        foreach ($items as $item) {
            $isBase = isset($item['is_base_unit']) && filter_var($item['is_base_unit'], FILTER_VALIDATE_BOOLEAN);
            if ($isBase) {
                $baseUnitCount++;
            }
        }

        if ($baseUnitCount !== 1) {
            throw new \InvalidArgumentException('A product must have exactly one base unit.');
        }

        return DB::transaction(function () use ($payload, $items) {
            if (!empty($payload['product_id'])) {
                $product = Product::findOrFail($payload['product_id']);
                // Clear existing packaging items for this product first
                $product->items()->delete();
                if (!empty($payload['name'])) {
                    $product->update(['name' => $payload['name']]);
                }
            } else {
                // Create the Product
                $product = Product::create([
                    'name' => $payload['name'] ?? null,
                ]);
            }

            // Sync businesses if business_ids are present in payload
            if (!empty($payload['business_ids'])) {
                $product->businesses()->sync($payload['business_ids']);
            }

            // Insert product items
            foreach ($items as $item) {
                $isBase = isset($item['is_base_unit']) && filter_var($item['is_base_unit'], FILTER_VALIDATE_BOOLEAN);
                
                // If it is base unit, forcibly override conversion rate to 1
                $conversionRate = $isBase ? 1.0000 : ($item['conversion_rate'] ?? 1.0000);

                ProductItem::create([
                    'product_id' => $product->id,
                    'measurement_unit_id' => $item['measurement_unit_id'],
                    'is_base_unit' => $isBase,
                    'conversion_rate' => $conversionRate,
                    'is_active' => filter_var($item['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ]);
            }

            return $product->load('items');
        });
    }

    /**
     * Update a product and its units atomically.
     *
     * @param Product $product
     * @param array $payload
     * @return Product
     * @throws \InvalidArgumentException
     */
    public function updateProduct(Product $product, array $payload): Product
    {
        $items = $payload['items'] ?? [];
        if (!is_array($items) || empty($items)) {
            throw new \InvalidArgumentException('Product must have at least one unit item.');
        }

        // Count how many base units are present in the payload
        $baseUnitCount = 0;
        foreach ($items as $item) {
            $isBase = isset($item['is_base_unit']) && filter_var($item['is_base_unit'], FILTER_VALIDATE_BOOLEAN);
            if ($isBase) {
                $baseUnitCount++;
            }
        }

        if ($baseUnitCount !== 1) {
            throw new \InvalidArgumentException('A product must have exactly one base unit.');
        }

        return DB::transaction(function () use ($product, $payload, $items) {
            // Update the Product name
            $product->update([
                'name' => $payload['name'] ?? $product->name,
            ]);

            // Sync businesses if business_ids are present in payload
            if (isset($payload['business_ids'])) {
                $product->businesses()->sync($payload['business_ids']);
            }

            // Delete old items
            $product->items()->delete();

            // Insert new product items
            foreach ($items as $item) {
                $isBase = isset($item['is_base_unit']) && filter_var($item['is_base_unit'], FILTER_VALIDATE_BOOLEAN);
                
                // If it is base unit, forcibly override conversion rate to 1
                $conversionRate = $isBase ? 1.0000 : ($item['conversion_rate'] ?? 1.0000);

                ProductItem::create([
                    'product_id' => $product->id,
                    'measurement_unit_id' => $item['measurement_unit_id'],
                    'is_base_unit' => $isBase,
                    'conversion_rate' => $conversionRate,
                    'is_active' => filter_var($item['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                ]);
            }

            return $product->load('items');
        });
    }
}
