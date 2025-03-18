<?php
// Configurações básicas do servidor
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Constantes
define('DATA_DIR', __DIR__ . '/data/');

// Assegura que o diretório de dados existe
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// Verifica e ajusta permissões do diretório de dados
if (is_dir(DATA_DIR) && !is_writable(DATA_DIR)) {
    chmod(DATA_DIR, 0777);
}

// Função para ler um arquivo JSON
function readJsonFile($filename) {
    $filePath = DATA_DIR . $filename;
    if (!file_exists($filePath)) {
        // Cria o arquivo vazio se não existir
        file_put_contents($filePath, json_encode([], JSON_PRETTY_PRINT));
        chmod($filePath, 0666); // Garante permissões de leitura/escrita
        return [];
    }
    
    $jsonContent = file_get_contents($filePath);
    if (empty($jsonContent)) {
        return [];
    }
    
    $data = json_decode($jsonContent, true);
    return is_array($data) ? $data : [];
}

// Função para salvar dados em um arquivo JSON
function saveJsonFile($filename, $data) {
    $filePath = DATA_DIR . $filename;
    
    // Cria o diretório se não existir
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }
    
    // Gera o JSON com formatação adequada
    $jsonContent = json_encode($data, JSON_PRETTY_PRINT);
    if ($jsonContent === false) {
        return false;
    }
    
    // Salva o arquivo com bloqueio exclusivo para evitar corridas
    $result = file_put_contents($filePath, $jsonContent, LOCK_EX);
    
    // Ajusta permissões do arquivo
    if ($result !== false && file_exists($filePath)) {
        chmod($filePath, 0666);
    }
    
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
    // Lidar com preflight OPTIONS
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        header("HTTP/1.1 200 OK");
        exit();
    }
    return $_SERVER['REQUEST_METHOD'];
}

// Função para obter os dados da requisição
function getRequestData() {
    $data = file_get_contents('php://input');
    return json_decode($data, true);
}

// Função para gerar ID único
function generateUniqueId($prefix = '') {
    return $prefix . uniqid(mt_rand(), true);
}

// Função para limpar o cache de opcode, se disponível
function clearOpcodeCache() {
    if (function_exists('opcache_reset')) {
        opcache_reset();
    }
}
?> 