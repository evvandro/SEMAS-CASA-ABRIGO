<?php
\app/Http/Controllers/AcolhidoController.php = 'app/Http/Controllers/AcolhidoController.php';
\ = file_get_contents(\app/Http/Controllers/AcolhidoController.php);
\ = strpos(\, '    public function saida');
if (\ !== false) {
    \ = substr(\, 0, \);
    \ = <<<EOT
    public function saida(RegistrarSaidaAcolhidoRequest \, Acolhido \): JsonResponse
    {
        \ = \->input('detalhes_saida', []);

        \->update([
            'data_saida' => \->input('data_saida'),
            'hora_saida' => \['hora'] ?? \->input('hora_saida'),
            'tipo_saida' => \->input('tipo_saida'),
            'destino_informado' => \['destinoInformado'] ?? \->input('destino_informado'),
            'endereco_destino' => \['destinoEndereco'] ?? \->input('endereco_destino'),
            'municipio_destino' => \['destinoMunicipio'] ?? \->input('municipio_destino'),
            'telefone_destino' => \['destinoTelefone'] ?? \->input('telefone_destino'),
            'encaminhamentos_rede' => \['encaminhamentos'] ?? \->input('encaminhamentos_rede'),
            'resumo_encaminhamento' => \['encaminhamentoResumo'] ?? \->input('resumo_encaminhamento'),
            'condicao_saida' => \['condicoesNaSaida'] ?? \->input('condicao_saida'),
            'observacoes_tecnicas' => \['condicoesObservacoes'] ?? \->input('observacoes_tecnicas'),
            'responsavel_desligamento' => \['responsavelNome'] ?? \->input('responsavel_desligamento'),
            'cargo_responsavel' => \['responsavelCargo'] ?? \->input('cargo_responsavel'),
        ]);

        if (\->familia_id) {
            \ = Acolhido::where('familia_id', \->familia_id)
                ->where('id', '!=', \->id)
                ->whereNull('data_saida')
                ->exists();

            if (!\) {
                \->familia()->update([
                    'data_saida' => \->input('data_saida'),
                    'hora_saida' => \['hora'] ?? \->input('hora_saida'),
                    'destino_informado' => \['destinoInformado'] ?? \->input('destino_informado'),
                    'endereco_destino' => \['destinoEndereco'] ?? \->input('endereco_destino'),
                    'municipio_destino' => \['destinoMunicipio'] ?? \->input('municipio_destino'),
                    'telefone_destino' => \['destinoTelefone'] ?? \->input('telefone_destino'),
                    'encaminhamentos_rede' => isset(\['encaminhamentos']) ? json_encode(\['encaminhamentos']) : null,
                    'resumo_encaminhamento' => \['encaminhamentoResumo'] ?? \->input('resumo_encaminhamento'),
                    'condicao_saida' => \['condicoesNaSaida'] ?? \->input('condicao_saida'),
                    'observacoes_tecnicas' => \['condicoesObservacoes'] ?? \->input('observacoes_tecnicas'),
                    'responsavel_desligamento' => \['responsavelNome'] ?? \->input('responsavel_desligamento'),
                    'cargo_responsavel' => \['responsavelCargo'] ?? \->input('cargo_responsavel'),
                ]);
            }
        }

        return response()->json([
            'message' => 'Saída registrada com sucesso.',
            'data' => new AcolhidoDetalheResource(\->fresh()->load(['familia', 'setor'])),
        ]);
    }
}
EOT;
    file_put_contents(\app/Http/Controllers/AcolhidoController.php, \ . \);
}
