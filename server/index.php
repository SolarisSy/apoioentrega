<?php
header('Content-Type: application/json');

echo json_encode([
    'name' => 'Apoio Entrega API',
    'version' => '1.0.0',
    'description' => 'API para o e-commerce Apoio Entrega',
    'endpoints' => [
        [
            'path' => '/products.php',
            'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
            'description' => 'Gerenciamento de produtos'
        ],
        [
            'path' => '/categories.php',
            'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
            'description' => 'Gerenciamento de categorias'
        ],
        [
            'path' => '/cart.php',
            'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
            'description' => 'Gerenciamento de carrinho'
        ],
        [
            'path' => '/carousel.php',
            'methods' => ['GET', 'POST', 'PUT', 'DELETE'],
            'description' => 'Gerenciamento de carrossel'
        ]
    ]
]);
?> 