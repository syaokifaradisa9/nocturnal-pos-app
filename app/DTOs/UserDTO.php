<?php

namespace App\DTOs;

use App\Http\Requests\UserRequest;

class UserDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $username,
        public readonly ?string $password,
        public readonly ?string $address,
        public readonly ?string $phone,
        public readonly string $businessName,
        public readonly ?string $businessDescription,
        public readonly string $branchName,
        public readonly ?string $branchAddress,
        public readonly ?string $branchOpeningTime,
        public readonly ?string $branchEndTime,
        public readonly string $accountType
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(UserRequest $request): self
    {
        return new self(
            name: $request->input('name'),
            email: $request->input('email'),
            username: $request->input('username'),
            password: $request->input('password'),
            address: $request->input('address'),
            phone: $request->input('phone'),
            businessName: $request->input('business_name'),
            businessDescription: $request->input('business_description'),
            branchName: $request->input('branch_name'),
            branchAddress: $request->input('branch_address'),
            branchOpeningTime: $request->input('branch_opening_time'),
            branchEndTime: $request->input('branch_end_time'),
            accountType: $request->input('account_type')
        );
    }

    /**
     * Convert DTO to array for User database persistence.
     */
    public function toUserArray(): array
    {
        $data = [
            'name' => $this->name,
            'email' => $this->email,
            'username' => $this->username,
            'address' => $this->address,
            'phone' => $this->phone,
        ];

        if ($this->password) {
            $data['password'] = bcrypt($this->password);
        }

        return $data;
    }

    /**
     * Convert DTO to array for Business database persistence.
     */
    public function toBusinessArray(): array
    {
        return [
            'name' => $this->businessName,
            'description' => $this->businessDescription,
        ];
    }

    /**
     * Convert DTO to array for Branch database persistence.
     */
    public function toBranchArray(): array
    {
        return [
            'name' => $this->branchName,
            'address' => $this->branchAddress,
            'opening_time' => $this->branchOpeningTime,
            'end_time' => $this->branchEndTime,
        ];
    }
}
