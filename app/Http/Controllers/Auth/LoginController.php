<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm(): Response
    {
        return Inertia::render('auth/login');
    }

    /**
     * Handle the login request.
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();
        
        $loginField = filter_var($credentials['email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $authCredentials = [
            $loginField => $credentials['email'],
            'password' => $credentials['password'],
        ];

        if (! Auth::attempt($authCredentials)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Log the user out of the application.
     */
    public function logout(): RedirectResponse
    {
        Auth::logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login');
    }
}
