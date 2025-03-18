<?php
require_once 'config.php';

// Obter o método da requisição
$method = getRequestMethod();

// Manipular a requisição de acordo com o método
switch ($method) {
    case 'GET':
        // Se tiver um ID específico, retorna apenas uma categoria
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $categories = readJsonFile('categories.json');
            
            // Encontra a categoria pelo ID
            $category = null;
            foreach ($categories as $c) {
                if ($c['id'] == $id) {
                    $category = $c;
                    break;
                }
            }
            
            if ($category) {
                jsonResponse($category);
            } else {
                errorResponse("Categoria não encontrada", 404);
            }
        } 
        // Se tiver um parentId, retorna subcategorias
        else if (isset($_GET['parent'])) {
            $parentId = $_GET['parent'];
            $categories = readJsonFile('categories.json');
            
            // Filtra as categorias pelo parentId
            $filteredCategories = array_filter($categories, function($c) use ($parentId) {
                return isset($c['parentId']) && $c['parentId'] == $parentId;
            });
            
            jsonResponse(array_values($filteredCategories));
        }
        // Se tiver mainCategories=true, retorna apenas categorias principais
        else if (isset($_GET['mainCategories']) && $_GET['mainCategories'] == 'true') {
            $categories = readJsonFile('categories.json');
            
            // Filtra apenas categorias principais (parentId = null)
            $mainCategories = array_filter($categories, function($c) {
                return !isset($c['parentId']) || $c['parentId'] === null;
            });
            
            jsonResponse(array_values($mainCategories));
        }
        // Caso contrário, retorna todas as categorias
        else {
            $categories = readJsonFile('categories.json');
            jsonResponse($categories);
        }
        break;
    
    case 'POST':
        // Adiciona uma nova categoria
        $data = getRequestData();
        
        // Valida os dados necessários
        if (!isset($data['name'])) {
            errorResponse("Nome da categoria não fornecido");
        }
        
        $categories = readJsonFile('categories.json');
        
        // Gera um novo ID se não for fornecido
        if (!isset($data['id'])) {
            // Verifica se as categorias usam o formato "catX" ou números
            $usesCatPrefix = false;
            foreach ($categories as $c) {
                if (is_string($c['id']) && strpos($c['id'], 'cat') === 0) {
                    $usesCatPrefix = true;
                    break;
                }
            }
            
            if ($usesCatPrefix) {
                $maxId = 0;
                foreach ($categories as $c) {
                    $id = intval(str_replace('cat', '', $c['id']));
                    if ($id > $maxId) {
                        $maxId = $id;
                    }
                }
                $data['id'] = 'cat' . ($maxId + 1);
            } else {
                $maxId = 0;
                foreach ($categories as $c) {
                    if (is_numeric($c['id']) && $c['id'] > $maxId) {
                        $maxId = $c['id'];
                    }
                }
                $data['id'] = $maxId + 1;
            }
        }
        
        // Define parentId como null se não for fornecido
        if (!isset($data['parentId'])) {
            $data['parentId'] = null;
        }
        
        // Adiciona a categoria
        $categories[] = $data;
        
        // Salva o arquivo
        if (saveJsonFile('categories.json', $categories)) {
            jsonResponse($data, 201);
        } else {
            errorResponse("Erro ao salvar a categoria", 500);
        }
        break;
    
    case 'PUT':
        // Atualiza uma categoria existente
        $data = getRequestData();
        
        // Verifica se o ID foi fornecido
        if (!isset($data['id'])) {
            errorResponse("ID da categoria não fornecido");
        }
        
        $categories = readJsonFile('categories.json');
        $found = false;
        
        // Atualiza a categoria
        foreach ($categories as &$c) {
            if ($c['id'] == $data['id']) {
                $c = array_merge($c, $data);
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            errorResponse("Categoria não encontrada", 404);
        }
        
        // Salva o arquivo
        if (saveJsonFile('categories.json', $categories)) {
            jsonResponse($data);
        } else {
            errorResponse("Erro ao atualizar a categoria", 500);
        }
        break;
    
    case 'DELETE':
        // Remove uma categoria
        if (!isset($_GET['id'])) {
            errorResponse("ID da categoria não fornecido");
        }
        
        $id = $_GET['id'];
        $categories = readJsonFile('categories.json');
        $found = false;
        
        // Filtra a categoria a ser removida
        $newCategories = array_filter($categories, function($c) use ($id, &$found) {
            if ($c['id'] == $id) {
                $found = true;
                return false;
            }
            return true;
        });
        
        if (!$found) {
            errorResponse("Categoria não encontrada", 404);
        }
        
        // Verifica se há produtos usando esta categoria
        $products = readJsonFile('products.json');
        $productsWithCategory = array_filter($products, function($p) use ($id) {
            return $p['categoryId'] == $id;
        });
        
        if (count($productsWithCategory) > 0) {
            // Atualiza os produtos para remover a referência à categoria
            foreach ($products as &$p) {
                if ($p['categoryId'] == $id) {
                    $p['categoryId'] = null;
                }
            }
            
            // Salva os produtos atualizados
            saveJsonFile('products.json', $products);
        }
        
        // Atualiza as subcategorias para apontar para null ou para a categoria pai
        if (isset($_GET['updateSubcategories']) && $_GET['updateSubcategories'] == 'true') {
            foreach ($categories as &$c) {
                if (isset($c['parentId']) && $c['parentId'] == $id) {
                    // Se tiver uma categoria pai para transferir
                    if (isset($_GET['newParentId'])) {
                        $c['parentId'] = $_GET['newParentId'];
                    } else {
                        $c['parentId'] = null;
                    }
                }
            }
        }
        
        // Salva o arquivo
        if (saveJsonFile('categories.json', array_values($newCategories))) {
            jsonResponse(['message' => 'Categoria removida com sucesso']);
        } else {
            errorResponse("Erro ao remover a categoria", 500);
        }
        break;
    
    default:
        errorResponse("Método não suportado", 405);
        break;
}
?> 