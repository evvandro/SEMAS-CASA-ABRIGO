<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List all system users.
     */
    public function index(): JsonResponse
    {
        $users = User::query()->orderBy('name')->get();

        return response()->json([
            'message' => 'Usuários listados com sucesso.',
            'data' => UserResource::collection($users),
        ]);
    }

    /**
     * Create a new restricted user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return response()->json([
            'message' => 'Usuário criado com sucesso.',
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * Update an existing user's data.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();
        $actor = $request->user();

        if ($actor?->is($user)) {
            $wouldRemoveOwnAdminRole = isset($validated['role']) && $validated['role'] !== User::ROLE_ADMIN;
            $wouldDeactivateOwnAccount = array_key_exists('is_active', $validated) && ! $validated['is_active'];

            if ($wouldRemoveOwnAdminRole || $wouldDeactivateOwnAccount) {
                return response()->json([
                    'message' => 'Não é possível remover o acesso administrativo da própria conta.',
                ], 403);
            }
        }

        $mustRevokeTokens = array_key_exists('password', $validated)
            || (array_key_exists('is_active', $validated) && ! $validated['is_active']);

        $user->update($validated);

        if ($mustRevokeTokens) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Deactivate a user (soft disable — never physically deletes).
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Não é possível desativar sua própria conta.',
            ], 403);
        }

        $user->update(['is_active' => false]);
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Usuário desativado com sucesso.',
        ]);
    }
}
