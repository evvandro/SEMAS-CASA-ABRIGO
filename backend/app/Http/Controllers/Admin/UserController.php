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
        $user->update($request->validated());

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

        return response()->json([
            'message' => 'Usuário desativado com sucesso.',
        ]);
    }
}
