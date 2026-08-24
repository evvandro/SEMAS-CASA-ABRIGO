use App\Models\Acolhido;
use App\Models\Entrega;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

// Somente leitura: valida se o SQL dos relatorios (testado em SQLite) roda no PostgreSQL.
echo 'driver='.DB::connection()->getDriverName().' db='.DB::connection()->getDatabaseName()."\n";

$ok = fn ($n) => print("  OK    $n\n");
$ko = fn ($n, $e) => print("  FALHA $n -> ".substr($e->getMessage(), 0, 160)."\n");

// 1) CASE com bindings de data + GROUP BY alias (perfil / faixas etarias)
try {
    $ref = Carbon::parse('2026-08-24');
    $lim = collect([12, 18, 30, 60])->map(fn ($a) => $ref->copy()->subYears($a)->format('Y-m-d 00:00:00'))->all();
    Acolhido::query()->selectRaw("CASE
        WHEN data_nascimento IS NULL THEN 'sem_data'
        WHEN data_nascimento > ? THEN '0-11'
        WHEN data_nascimento > ? THEN '12-17'
        WHEN data_nascimento > ? THEN '18-29'
        WHEN data_nascimento > ? THEN '30-59'
        ELSE '60+' END as faixa, COUNT(*) as total", $lim)
        ->groupBy('faixa')->pluck('total', 'faixa');
    $ok('perfil: CASE + binding de data + GROUP BY alias');
} catch (Throwable $e) {
    $ko('perfil faixas', $e);
}

// 2) contagemPorDia: alias no GROUP BY sobre coluna date
try {
    $r = Acolhido::query()
        ->whereDate('data_entrada', '>=', '2026-01-01')->whereDate('data_entrada', '<=', '2026-12-31')
        ->selectRaw('data_entrada as dia, COUNT(*) as total')->groupBy('dia')->pluck('total', 'dia');
    $ok('contagemPorDia: GROUP BY alias (chave devolvida: '.($r->keys()->first() ?: 'sem linhas').')');
} catch (Throwable $e) {
    $ko('contagemPorDia', $e);
}

// 3) COALESCE + GROUP BY alias (motivos de saida)
try {
    Acolhido::query()->selectRaw("COALESCE(tipo_saida,'Nao informado') as motivo, COUNT(*) as total")
        ->groupBy('motivo')->orderByDesc('total')->get();
    $ok('acolhimentos: COALESCE + GROUP BY alias');
} catch (Throwable $e) {
    $ko('motivos saida', $e);
}

// 4) booleanos (boolean no PG vs integer no SQLite)
try {
    Acolhido::query()->where('pcd', true)->count();
    $ok('perfil: filtro booleano portavel');
} catch (Throwable $e) {
    $ko('booleano', $e);
}

// 5) estoque: agregacoes sobre entregas
try {
    Entrega::query()->selectRaw("COALESCE(destino_tipo,'nao_informado') as destino, COUNT(*) as registros, SUM(quantidade) as itens")
        ->groupBy('destino')->get();
    Entrega::query()->selectRaw('data_entrega as dia, SUM(quantidade) as total')->groupBy('dia')->get();
    $ok('estoque: agregacoes de entregas');
} catch (Throwable $e) {
    $ko('estoque entregas', $e);
}

// 6) migrations ainda nao aplicadas no banco
try {
    $ran = DB::table('migrations')->pluck('migration')->all();
    $files = collect(glob(base_path('database/migrations/*.php')))->map(fn ($f) => basename($f, '.php'))->all();
    $pend = array_values(array_diff($files, $ran));
    echo "\nmigrations pendentes: ".(count($pend) ? implode(', ', $pend) : 'nenhuma')."\n";
} catch (Throwable $e) {
    echo '  FALHA ao ler migrations -> '.$e->getMessage()."\n";
}
