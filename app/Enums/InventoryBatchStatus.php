<?php

namespace App\Enums;

enum InventoryBatchStatus: string
{
    case ACTIVE = 'Active';
    case EXHAUSTED = 'Exhausted';
    case EXPIRED = 'Expired';
}
