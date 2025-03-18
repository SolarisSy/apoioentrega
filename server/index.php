<?php
// Desativar relatório de erros na produção
error_reporting(0);
ini_set('display_errors', 0);

// Configurações de CORS - mais permissivas
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Responder imediatamente a solicitações OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Iniciar sessão
session_start();

// Definindo diretório de dados com permissões abertas
$dataDir = __DIR__ . '/data/';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
    chmod($dataDir, 0777);
}

// Rota padrão - apenas retorna uma resposta de status
echo json_encode([
    'status' => 'success',
    'message' => 'API do Apoio Entrega está funcionando',
    'server_info' => [
        'time' => date('Y-m-d H:i:s'),
        'php_version' => phpversion()
    ]
]);
?> 