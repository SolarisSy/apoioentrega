<?php
// Configurações básicas do servidor
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Constantes
define('DATA_DIR', __DIR__ . '/data/');

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
        mkdir(DATA_DIR, 0755, true);
    }
    
    $result = file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
    return $result !== false;
}

// Função para responder com JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    
    // Garantir que arrays associativos sejam tratados corretamente
    if (is_array($data)) {
        // Verificar se é um array associativo
        $isAssoc = array_keys($data) !== range(0, count($data) - 1);
        
        // Se for associativo e não vazio, converter para array numérico
        if ($isAssoc && !empty($data)) {
            $data = array_values($data);
        }
    }
    
    echo json_encode($data, JSON_NUMERIC_CHECK);
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