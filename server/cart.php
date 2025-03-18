<?php
require_once 'config.php';

// Obter o método da requisição
$method = getRequestMethod();

// Para o carrinho, precisamos identificar o usuário de alguma forma
// Como não temos autenticação, usaremos um sessionId enviado pelo cliente
$sessionId = isset($_GET['sessionId']) ? $_GET['sessionId'] : '';

if (empty($sessionId)) {
    $sessionId = isset($_COOKIE['sessionId']) ? $_COOKIE['sessionId'] : '';
}

if (empty($sessionId)) {
    errorResponse("Session ID não fornecido. É necessário um identificador de sessão.", 400);
}

// Nome do arquivo do carrinho para esta sessão
$cartFilename = 'cart_' . $sessionId . '.json';

// Manipular a requisição de acordo com o método
switch ($method) {
    case 'GET':
        // Retorna os itens do carrinho
        $cart = readJsonFile($cartFilename);
        jsonResponse($cart);
        break;
    
    case 'POST':
        // Adiciona um item ao carrinho
        $data = getRequestData();
        
        // Valida os dados necessários
        if (!isset($data['id']) || !isset($data['name']) || !isset($data['price'])) {
            errorResponse("Dados incompletos do item");
        }
        
        // Define a quantidade padrão se não for fornecida
        if (!isset($data['quantity']) || $data['quantity'] <= 0) {
            $data['quantity'] = 1;
        }
        
        $cart = readJsonFile($cartFilename);
        
        // Verifica se o produto já existe no carrinho
        $found = false;
        foreach ($cart as &$item) {
            if ($item['id'] == $data['id']) {
                $item['quantity'] += $data['quantity'];
                $found = true;
                break;
            }
        }
        
        // Se não encontrou, adiciona o novo item
        if (!$found) {
            $cart[] = $data;
        }
        
        // Salva o arquivo
        if (saveJsonFile($cartFilename, $cart)) {
            jsonResponse(['message' => 'Item adicionado ao carrinho', 'cart' => $cart]);
        } else {
            errorResponse("Erro ao salvar o carrinho", 500);
        }
        break;
    
    case 'PUT':
        // Atualiza um item do carrinho (geralmente a quantidade)
        $data = getRequestData();
        
        // Verifica se o ID foi fornecido
        if (!isset($data['id'])) {
            errorResponse("ID do item não fornecido");
        }
        
        // Verifica se a quantidade foi fornecida
        if (!isset($data['quantity'])) {
            errorResponse("Quantidade não fornecida");
        }
        
        $cart = readJsonFile($cartFilename);
        $found = false;
        
        // Atualiza o item
        foreach ($cart as $key => &$item) {
            if ($item['id'] == $data['id']) {
                if ($data['quantity'] <= 0) {
                    // Se a quantidade for zero ou negativa, remove o item
                    unset($cart[$key]);
                    $cart = array_values($cart); // Reindexar array
                } else {
                    // Atualiza a quantidade
                    $item['quantity'] = $data['quantity'];
                }
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            errorResponse("Item não encontrado no carrinho", 404);
        }
        
        // Salva o arquivo
        if (saveJsonFile($cartFilename, $cart)) {
            jsonResponse(['message' => 'Carrinho atualizado', 'cart' => $cart]);
        } else {
            errorResponse("Erro ao atualizar o carrinho", 500);
        }
        break;
    
    case 'DELETE':
        // Remove um item do carrinho ou limpa o carrinho todo
        if (isset($_GET['clear']) && $_GET['clear'] == 'true') {
            // Limpa o carrinho inteiro
            if (saveJsonFile($cartFilename, [])) {
                jsonResponse(['message' => 'Carrinho limpo com sucesso']);
            } else {
                errorResponse("Erro ao limpar o carrinho", 500);
            }
        } 
        else if (isset($_GET['id'])) {
            // Remove um item específico
            $id = $_GET['id'];
            $cart = readJsonFile($cartFilename);
            $found = false;
            
            // Filtra o item a ser removido
            $newCart = array_filter($cart, function($item) use ($id, &$found) {
                if ($item['id'] == $id) {
                    $found = true;
                    return false;
                }
                return true;
            });
            
            if (!$found) {
                errorResponse("Item não encontrado no carrinho", 404);
            }
            
            // Salva o arquivo
            if (saveJsonFile($cartFilename, array_values($newCart))) {
                jsonResponse(['message' => 'Item removido do carrinho', 'cart' => array_values($newCart)]);
            } else {
                errorResponse("Erro ao atualizar o carrinho", 500);
            }
        } 
        else {
            errorResponse("Parâmetro não fornecido", 400);
        }
        break;
    
    default:
        errorResponse("Método não suportado", 405);
        break;
}
?> 