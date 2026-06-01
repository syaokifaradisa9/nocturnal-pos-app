<?php

namespace App\Services;

use App\Models\Role;
use App\Http\Requests\DatatableRequest;
use Illuminate\Database\Eloquent\Builder;

class RoleDatatableService
{
    /**
     * Get the starting query with pre-loaded relations, search, and sorting filters.
     */
    private function getStartedQuery(DatatableRequest $request): Builder
    {
        $query = Role::query()->with('permissions');

        $search = $request->validated('search');
        $sortField = $request->validated('sort_by') ?? 'id';
        $sortOrder = $request->validated('sort_type') ?? 'desc';

        // Apply global search via when()
        $query->when($search, function (Builder $q) use ($search) {
            $q->where(function (Builder $sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        });

        // Apply individual column searches via when()
        $query->when($request->input('name'), function (Builder $q, $name) {
            $q->where('name', 'like', "%{$name}%");
        })->when($request->input('description'), function (Builder $q, $description) {
            $q->where('description', 'like', "%{$description}%");
        });

        // Apply sorting via when()
        $query->when($sortField, function (Builder $q) use ($sortField, $sortOrder) {
            $q->orderBy($sortField, $sortOrder);
        });

        return $query;
    }

    /**
     * Handle the datatable query and return paginated, searched results.
     */
    public function getDatatable(DatatableRequest $request)
    {
        $perPage = $request->validated('limit') ?? 10;
        return $this->getStartedQuery($request)->paginate($perPage);
    }
}
