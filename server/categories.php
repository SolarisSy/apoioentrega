<?php
require_once 'config.php';

// Configuração de cabeçalhos para evitar cache
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');

$categoriesFile = __DIR__ . '/data/categories.json';

// Método HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Verifica se o arquivo existe, caso não exista cria com um array vazio
    if (!file_exists($categoriesFile)) {
        file_put_contents($categoriesFile, json_encode([]));
    }
    
    // Lê as categorias
    $categories = readJsonFile($categoriesFile);
    if (!is_array($categories)) {
        $categories = [];
    }
    
    // GET - Obtém categorias
    if ($method === 'GET') {
        // Se o ID for fornecido, retorna uma categoria específica
        if (isset($_GET['id'])) {
            $categoryId = $_GET['id'];
            $category = null;
            
            foreach ($categories as $cat) {
                if ($cat['id'] === $categoryId) {
                    $category = $cat;
                    break;
                }
            }
            
            if ($category) {
                echo json_encode($category);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Categoria não encontrada']);
            }
        }
        // Se mainCategories for true, retorna apenas categorias principais
        else if (isset($_GET['mainCategories']) && $_GET['mainCategories'] === 'true') {
            $mainCategories = array_filter($categories, function($cat) {
                return $cat['parentId'] === null;
            });
            echo json_encode(array_values($mainCategories));
        }
        // Se parentId for fornecido, retorna subcategorias
        else if (isset($_GET['parent'])) {
            $parentId = $_GET['parent'];
            $subcategories = array_filter($categories, function($cat) use ($parentId) {
                return $cat['parentId'] === $parentId;
            });
            echo json_encode(array_values($subcategories));
        }
        // Caso contrário, retorna todas as categorias
        else {
            echo json_encode($categories);
        }
    }
    
    // POST - Adiciona uma nova categoria
    else if ($method === 'POST') {
        // Obtém os dados da requisição
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Valida os dados
        if (!isset($data['name']) || empty(trim($data['name']))) {
            http_response_code(400);
            echo json_encode(['error' => 'Nome da categoria é obrigatório']);
            exit;
        }
        
        // Cria a nova categoria
        $newCategory = [
            'id' => 'cat' . uniqid(),
            'name' => trim($data['name']),
            'parentId' => isset($data['parentId']) ? $data['parentId'] : null,
            'createdAt' => date('Y-m-d H:i:s')
        ];
        
        // Adiciona a categoria
        $categories[] = $newCategory;
        
        // Salva as categorias
        saveJsonFile($categoriesFile, $categories);
        
        // Define cabeçalhos para evitar cache
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Retorna a categoria criada
        echo json_encode($newCategory);
    }
    
    // PUT - Atualiza uma categoria existente
    else if ($method === 'PUT') {
        // Obtém os dados da requisição
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Valida os dados
        if (!isset($data['id']) || !isset($data['name']) || empty(trim($data['name']))) {
            http_response_code(400);
            echo json_encode(['error' => 'ID e nome da categoria são obrigatórios']);
            exit;
        }
        
        // Procura a categoria
        $categoryId = $data['id'];
        $categoryFound = false;
        
        foreach ($categories as $key => $category) {
            if ($category['id'] === $categoryId) {
                // Atualiza a categoria
                $categories[$key]['name'] = trim($data['name']);
                $categories[$key]['parentId'] = isset($data['parentId']) ? $data['parentId'] : null;
                $categories[$key]['updatedAt'] = date('Y-m-d H:i:s');
                $updatedCategory = $categories[$key];
                $categoryFound = true;
                break;
            }
        }
        
        if (!$categoryFound) {
            http_response_code(404);
            echo json_encode(['error' => 'Categoria não encontrada']);
            exit;
        }
        
        // Salva as categorias
        saveJsonFile($categoriesFile, $categories);
        
        // Define cabeçalhos para evitar cache
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Retorna a categoria atualizada
        echo json_encode($updatedCategory);
    }
    
    // DELETE - Remove uma categoria
    else if ($method === 'DELETE') {
        // Obtém o ID da categoria
        $categoryId = $_GET['id'] ?? null;
        
        if (!$categoryId) {
            http_response_code(400);
            echo json_encode(['error' => 'ID da categoria é obrigatório']);
            exit;
        }
        
        // Procura a categoria
        $categoryFound = false;
        $categoryIndex = -1;
        
        foreach ($categories as $key => $category) {
            if ($category['id'] === $categoryId) {
                $categoryFound = true;
                $categoryIndex = $key;
                break;
            }
        }
        
        if (!$categoryFound) {
            http_response_code(404);
            echo json_encode(['error' => 'Categoria não encontrada']);
            exit;
        }
        
        // Remove a categoria
        array_splice($categories, $categoryIndex, 1);
        
        // Atualiza subcategorias se necessário
        if (isset($_GET['updateSubcategories']) && $_GET['updateSubcategories'] === 'true') {
            $newParentId = $_GET['newParentId'] ?? null;
            
            foreach ($categories as $key => $category) {
                if ($category['parentId'] === $categoryId) {
                    $categories[$key]['parentId'] = $newParentId;
                    $categories[$key]['updatedAt'] = date('Y-m-d H:i:s');
                }
            }
        }
        
        // Salva as categorias
        saveJsonFile($categoriesFile, $categories);
        
        // Define cabeçalhos para evitar cache
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Retorna sucesso
        echo json_encode(['success' => true, 'message' => 'Categoria excluída com sucesso']);
    }
    
    // Outros métodos
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}
?> 