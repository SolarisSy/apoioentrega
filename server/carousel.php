<?php
// Configurações de cabeçalho para CORS e tipo de resposta
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Lidando com requisições OPTIONS (pré-voo/preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Diretório de armazenamento de dados JSON
$dataDir = __DIR__ . '/data';

// Arquivo JSON para armazenar os slides do carrossel
$slidesFile = $dataDir . '/carousel.json';

// Verifica se o diretório de dados existe, se não, cria
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Verifica se o arquivo de slides existe, se não, cria com array vazio
if (!file_exists($slidesFile)) {
    file_put_contents($slidesFile, json_encode([]));
}

// Função para ler os slides
function getSlides() {
    global $slidesFile;
    $slides = json_decode(file_get_contents($slidesFile), true) ?: [];
    return $slides;
}

// Função para salvar os slides
function saveSlides($slides) {
    global $slidesFile;
    file_put_contents($slidesFile, json_encode($slides, JSON_PRETTY_PRINT));
}

// Método GET - Obter slides
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    // Verificar se está buscando um slide específico
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $slides = getSlides();
        $filteredSlides = array_values(array_filter($slides, function($slide) use ($id) {
            return $slide['id'] == $id;
        }));
        
        if (count($filteredSlides) > 0) {
            echo json_encode($filteredSlides[0]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Slide não encontrado"]);
        }
    } else {
        // Retornar todos os slides
        echo json_encode(getSlides());
    }
}
// Método POST - Adicionar slide
else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos"]);
        exit;
    }
    
    $slides = getSlides();
    
    // Gerar ID único se não fornecido
    if (!isset($data['id'])) {
        $data['id'] = uniqid('slide_');
    }
    
    // Adicionar timestamp
    $data['createdAt'] = date('Y-m-d H:i:s');
    
    // Definir ordem
    if (!isset($data['order'])) {
        $data['order'] = count($slides) + 1;
    }
    
    // Adicionar slide
    $slides[] = $data;
    
    // Salvar alterações
    saveSlides($slides);
    
    echo json_encode($data);
}
// Método PUT - Atualizar slide
else if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos ou ID não fornecido"]);
        exit;
    }
    
    $slides = getSlides();
    $found = false;
    
    // Atualizar slide existente
    foreach ($slides as $key => $slide) {
        if ($slide['id'] == $data['id']) {
            // Manter created_at original
            if (isset($slide['createdAt'])) {
                $data['createdAt'] = $slide['createdAt'];
            }
            
            // Adicionar timestamp de atualização
            $data['updatedAt'] = date('Y-m-d H:i:s');
            
            // Atualizar slide
            $slides[$key] = $data;
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        http_response_code(404);
        echo json_encode(["error" => "Slide não encontrado"]);
        exit;
    }
    
    // Salvar alterações
    saveSlides($slides);
    
    echo json_encode($data);
}
// Método DELETE - Remover slide
else if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID não fornecido"]);
        exit;
    }
    
    $id = $_GET['id'];
    $slides = getSlides();
    $initialCount = count($slides);
    
    // Filtrar para remover o slide com o ID especificado
    $slides = array_values(array_filter($slides, function($slide) use ($id) {
        return $slide['id'] != $id;
    }));
    
    if (count($slides) == $initialCount) {
        http_response_code(404);
        echo json_encode(["error" => "Slide não encontrado"]);
        exit;
    }
    
    // Reordenar slides
    foreach ($slides as $key => $slide) {
        $slides[$key]['order'] = $key + 1;
    }
    
    // Salvar alterações
    saveSlides($slides);
    
    echo json_encode(["success" => true, "message" => "Slide removido com sucesso"]);
}
// Método não suportado
else {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido"]);
}
?> 