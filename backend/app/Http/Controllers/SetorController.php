<?php

namespace App\Http\Controllers;

use App\Http\Resources\SetorResource;
use App\Models\Setor;
use Illuminate\Http\JsonResponse;

class SetorController extends Controller
{
    public function index(): JsonResponse
    {
        $setores = Setor::query()
            ->where('ativo', true)
            ->orderBy('nome')
            ->get();

        return response()->json([
            'message' => 'Setores listados com sucesso.',
            'data' => SetorResource::collection($setores),
        ]);
    }
}
