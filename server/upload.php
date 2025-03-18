<?php
// Configurações de cabeçalho para CORS e tipo de resposta
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Diretório de uploads
$uploadDir = "../img/";

// Verifica se a pasta existe, se não, tenta criá-la
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'error' => 'Falha ao criar diretório de uploads'
        ]);
        exit;
    }
}

// Verifica se um arquivo foi enviado
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    // Gera um nome único para o arquivo
    $timestamp = time();
    $fileName = $timestamp . '_' . basename($_FILES['image']['name']);
    $targetFile = $uploadDir . $fileName;
    
    // Verifica o tipo de arquivo (opcional)
    $imageFileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!in_array($imageFileType, $allowedTypes)) {
        echo json_encode([
            'success' => false,
            'error' => 'Apenas imagens JPG, JPEG, PNG, GIF e WEBP são permitidas'
        ]);
        exit;
    }
    
    // Tenta mover o arquivo para o diretório de destino
    if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
        // Sempre usar caminho relativo para imagens (sem URL completa ou protocolo)
        // Isso garante compatibilidade em diferentes ambientes
        $imagePath = 'img/' . $fileName;
        
        echo json_encode([
            'success' => true,
            'imagePath' => $imagePath
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Erro ao salvar a imagem'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Nenhuma imagem enviada ou erro no upload'
    ]);
}
?> 