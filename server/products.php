<?php
require_once 'config.php';

// Obter o método da requisição
$method = getRequestMethod();

// Manipular a requisição de acordo com o método
switch ($method) {
    case 'GET':
        // Se tiver um ID específico, retorna apenas um produto
        if (isset($_GET['id'])) {
            $id = $_GET['id'];
            $products = readJsonFile('products.json');
            
            // Encontra o produto pelo ID
            $product = null;
            foreach ($products as $p) {
                if ($p['id'] == $id) {
                    $product = $p;
                    break;
                }
            }
            
            if ($product) {
                jsonResponse($product);
            } else {
                errorResponse("Produto não encontrado", 404);
            }
        } 
        // Se tiver uma categoria, retorna produtos dessa categoria
        else if (isset($_GET['category'])) {
            $categoryId = $_GET['category'];
            $products = readJsonFile('products.json');
            
            // Filtra os produtos pela categoria
            $filteredProducts = array_filter($products, function($p) use ($categoryId) {
                return $p['categoryId'] == $categoryId;
            });
            
            jsonResponse(array_values($filteredProducts));
        }
        // Se tiver um termo de busca, retorna produtos que correspondem
        else if (isset($_GET['search'])) {
            $searchTerm = strtolower($_GET['search']);
            $products = readJsonFile('products.json');
            
            // Filtra os produtos pelo termo de busca
            $filteredProducts = array_filter($products, function($p) use ($searchTerm) {
                return strpos(strtolower($p['name']), $searchTerm) !== false || 
                      (isset($p['description']) && strpos(strtolower($p['description']), $searchTerm) !== false);
            });
            
            jsonResponse(array_values($filteredProducts));
        }
        // Caso contrário, retorna todos os produtos
        else {
            $products = readJsonFile('products.json');
            jsonResponse($products);
        }
        break;
    
    case 'POST':
        // Adiciona um novo produto
        $data = getRequestData();
        
        // Valida os dados necessários
        if (!isset($data['name']) || !isset($data['price'])) {
            errorResponse("Dados incompletos do produto");
        }
        
        $products = readJsonFile('products.json');
        
        // Gera um novo ID
        $maxId = 0;
        foreach ($products as $p) {
            if ($p['id'] > $maxId) {
                $maxId = $p['id'];
            }
        }
        $data['id'] = $maxId + 1;
        
        // Adiciona o produto
        $products[] = $data;
        
        // Salva o arquivo
        if (saveJsonFile('products.json', $products)) {
            jsonResponse($data, 201);
        } else {
            errorResponse("Erro ao salvar o produto", 500);
        }
        break;
    
    case 'PUT':
        // Atualiza um produto existente
        $data = getRequestData();
        
        // Verifica se o ID foi fornecido
        if (!isset($data['id'])) {
            errorResponse("ID do produto não fornecido");
        }
        
        $products = readJsonFile('products.json');
        $found = false;
        
        // Atualiza o produto
        foreach ($products as &$p) {
            if ($p['id'] == $data['id']) {
                $p = array_merge($p, $data);
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            errorResponse("Produto não encontrado", 404);
        }
        
        // Salva o arquivo
        if (saveJsonFile('products.json', $products)) {
            jsonResponse($data);
        } else {
            errorResponse("Erro ao atualizar o produto", 500);
        }
        break;
    
    case 'DELETE':
        // Remove um produto
        if (!isset($_GET['id'])) {
            errorResponse("ID do produto não fornecido");
        }
        
        $id = $_GET['id'];
        $products = readJsonFile('products.json');
        $found = false;
        
        // Filtra o produto a ser removido
        $newProducts = array_filter($products, function($p) use ($id, &$found) {
            if ($p['id'] == $id) {
                $found = true;
                return false;
            }
            return true;
        });
        
        if (!$found) {
            errorResponse("Produto não encontrado", 404);
        }
        
        // Salva o arquivo
        if (saveJsonFile('products.json', array_values($newProducts))) {
            jsonResponse(['message' => 'Produto removido com sucesso']);
        } else {
            errorResponse("Erro ao remover o produto", 500);
        }
        break;
    
    default:
        errorResponse("Método não suportado", 405);
        break;
}
?> 