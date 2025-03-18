<?php
// Configurações básicas do servidor - mais permissivas
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Responder automaticamente a requisições OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Constantes
define('DATA_DIR', __DIR__ . '/data/');

// Garantir que o diretório de dados exista e tenha permissões adequadas
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0777, true);
}
chmod(DATA_DIR, 0777);

// Função para ler um arquivo JSON
function readJsonFile($filename) {
    $filePath = DATA_DIR . $filename;
    if (!file_exists($filePath)) {
        return [];
    }
    
    $jsonContent = file_get_contents($filePath);
    if (empty($jsonContent)) {
        return [];
    }
    
    return json_decode($jsonContent, true);
}

// Função para salvar dados em um arquivo JSON
function saveJsonFile($filename, $data) {
    $filePath = DATA_DIR . $filename;
    
    // Cria o diretório se não existir
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0777, true);
    }
    
    $result = file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
    // Definir permissões de arquivo
    chmod($filePath, 0666);
    return $result !== false;
}

// Função para responder com JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Função para lidar com erro
function errorResponse($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode(['error' => $message]);
    exit;
}

// Função para obter o método da requisição HTTP
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'];
}

// Função para obter os dados da requisição
function getRequestData() {
    $data = file_get_contents('php://input');
    return json_decode($data, true);
}
?> 