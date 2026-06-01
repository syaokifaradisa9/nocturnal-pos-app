<?php

namespace App\Enums;

enum StockAdjustmentStatus: string
{
    case DRAFT = 'Draft';
    case ADJUSTED = 'Adjusted';
}
