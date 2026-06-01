<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductItem;
use App\Models\ProductItemMeasurement;
use App\Models\ProductPriceTiering;
use Illuminate\Support\Facades\DB;

class ProductCatalogService
{
    /**
     * Store a product item and its measurements atomically.
     *
     * @param array $payload
     * @return ProductItem
     * @throws \InvalidArgumentException
     */
    public function storeProductItem(array $payload): ProductItem
    {
        $items = $payload['items'] ?? [];
        if (!is_array($items) || empty($items)) {
            throw new \InvalidArgumentException('Varian produk harus memiliki minimal satu satuan kemasan.');
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
            throw new \InvalidArgumentException('Varian produk harus memiliki tepat satu base unit.');
        }

        return DB::transaction(function () use ($payload, $items) {
            // Create the ProductItem
            $productItem = ProductItem::create([
                'product_id' => $payload['product_id'],
                'name' => $payload['name'],
                'is_active' => filter_var($payload['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ]);

            // Sync businesses if business_ids are present in payload
            if (!empty($payload['business_ids'])) {
                $product = Product::findOrFail($payload['product_id']);
                $product->businesses()->sync($payload['business_ids']);
            }

            // Insert measurements
            foreach ($items as $item) {
                $isBase = isset($item['is_base_unit']) && filter_var($item['is_base_unit'], FILTER_VALIDATE_BOOLEAN);
                
                // If it is base unit, forcibly override conversion rate to 1
                $conversionRate = $isBase ? 1.0000 : ($item['conversion_rate'] ?? 1.0000);

                $targetUnitId = $isBase ? null : ($item['target_measurement_unit_id'] ?? null);

                $measurement = ProductItemMeasurement::create([
                    'product_item_id' => $productItem->id,
                    'measurement_unit_id' => $item['measurement_unit_id'],
                    'is_base_unit' => $isBase,
                    'conversion_rate' => $conversionRate,
                    'target_measurement_unit_id' => $targetUnitId,
                ]);

                if (!empty($item['price_tierings']) && is_array($item['price_tierings'])) {
                    foreach ($item['price_tierings'] as $tier) {
                        ProductPriceTiering::create([
                            'product_item_measurement_id' => $measurement->id,
                            'minimum' => $tier['minimum'],
                            'price' => $tier['price'],
                        ]);
                    }
                }
            }

            return $productItem->load('measurements');
        });
    }

    /**
     * Update a product item and its measurements atomically.
     *
     * @param ProductItem $productItem
     * @param array $payload
     * @return ProductItem
     * @throws \InvalidArgumentException
     */
    public function updateProductItem(ProductItem $productItem, array $payload): ProductItem
    {
        $items = $payload['items'] ?? [];
        if (!is_array($items) || empty($items)) {
            throw new \InvalidArgumentException('Varian produk harus memiliki minimal satu satuan kemasan.');
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
            throw new \InvalidArgumentException('Varian produk harus memiliki tepat satu base unit.');
        }

        return DB::transaction(function () use ($productItem, $payload, $items) {
            // Update the ProductItem
            $productItem->update([
                'product_id' => $payload['product_id'] ?? $productItem->product_id,
                'name' => $payload['name'] ?? $productItem->name,
                'is_active' => filter_var($payload['is_active'] ?? $productItem->is_active, FILTER_VALIDATE_BOOLEAN),
            ]);

            // Sync businesses if business_ids are present in payload
            if (isset($payload['business_ids'])) {
                $product = $productItem->product;
                if ($product) {
                    $product->businesses()->sync($payload['business_ids']);
                }
            }

            // Delete old measurements
            $productItem->measurements()->delete();

            // Insert new measurements
            foreach ($items as $item) {
                $isBase = isset($item['is_base_unit']) && filter_var($item['is_base_unit'], FILTER_VALIDATE_BOOLEAN);
                
                // If it is base unit, forcibly override conversion rate to 1
                $conversionRate = $isBase ? 1.0000 : ($item['conversion_rate'] ?? 1.0000);

                $targetUnitId = $isBase ? null : ($item['target_measurement_unit_id'] ?? null);

                $measurement = ProductItemMeasurement::create([
                    'product_item_id' => $productItem->id,
                    'measurement_unit_id' => $item['measurement_unit_id'],
                    'is_base_unit' => $isBase,
                    'conversion_rate' => $conversionRate,
                    'target_measurement_unit_id' => $targetUnitId,
                ]);

                if (!empty($item['price_tierings']) && is_array($item['price_tierings'])) {
                    foreach ($item['price_tierings'] as $tier) {
                        ProductPriceTiering::create([
                            'product_item_measurement_id' => $measurement->id,
                            'minimum' => $tier['minimum'],
                            'price' => $tier['price'],
                        ]);
                    }
                }
            }

            return $productItem->load('measurements');
        });
    }
}
