# Documentação do E-commerce Apoio Entrega

## 1. Visão Geral do Projeto

### 1.1 Contexto e Propósito

O Apoio Entrega é um e-commerce desenvolvido para a venda de produtos relacionados a entregas e logística, focado principalmente em equipamentos e acessórios para entregadores. O sistema foi projetado para ser simples, eficiente e funcional, utilizando tecnologias web fundamentais (HTML, CSS e JavaScript) com backend PHP para persistência de dados.

### 1.2 Escopo

O projeto abrange:
- Interface de usuário para navegação e compra de produtos
- Sistema de categorias hierárquicas
- Carrinho de compras com persistência em servidor
- Busca de produtos com sugestões em tempo real
- Painel administrativo para gerenciamento de produtos, categorias e carrossel
- Armazenamento de dados em JSON com backend PHP
- Conteinerização com Docker para fácil implantação

### 1.3 Principais Funcionalidades

- **Catálogo de Produtos**: Visualização de produtos com filtros por categoria
- **Carrinho de Compras**: Adição, remoção e atualização de itens
- **Busca Inteligente**: Sistema de busca com sugestões em tempo real
- **Detalhes do Produto**: Modal com informações detalhadas e opções de compra
- **Navegação por Categorias**: Sistema hierárquico de categorias e subcategorias
- **Carrossel de Destaques**: Apresentação de banners promocionais
- **Painel Administrativo**: Gerenciamento completo do conteúdo do site
- **API REST**: Endpoints para gerenciamento de dados com persistência em arquivos JSON

## 2. Arquitetura do Sistema

### 2.1 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.4 para persistência de dados
- **Armazenamento**: Arquivos JSON no servidor
- **Conteinerização**: Docker e Docker Compose
- **Servidor Web**: Apache com PHP
- **Bibliotecas Externas**: Font Awesome (ícones)

### 2.2 Estrutura de Diretórios

```
/
├── index.html              # Página principal da loja
├── admin.html              # Painel de administração
├── sobre.html              # Página institucional
├── contato.html            # Página de contato
├── css/
│   ├── style.css           # Estilos da loja
│   └── admin.css           # Estilos do painel administrativo
├── js/
│   ├── main.js             # Lógica principal da loja
│   ├── products.js         # Gerenciamento de produtos
│   ├── categories.js       # Gerenciamento de categorias
│   ├── cart.js             # Gerenciamento do carrinho
│   ├── api.js              # Comunicação com a API do backend
│   └── admin.js            # Lógica do painel administrativo
├── img/                    # Imagens do site
├── server/                 # Backend PHP
│   ├── config.php          # Configurações do servidor
│   ├── products.php        # API de produtos
│   ├── categories.php      # API de categorias
│   ├── cart.php            # API de carrinho
│   ├── carousel.php        # API de carrossel
│   └── data/               # Armazenamento de dados JSON
│       ├── products.json   # Dados de produtos
│       ├── categories.json # Dados de categorias
│       ├── cart.json       # Dados de carrinho
│       └── carousel.json   # Dados de carrossel
├── Dockerfile              # Configuração do contêiner Docker
├── docker-compose.yml      # Orquestração de contêineres
├── .htaccess               # Configurações do Apache
├── start-apoioentrega.bat  # Script para iniciar no Windows
└── stop-apoioentrega.bat   # Script para parar no Windows
```

### 2.3 Diagrama de Arquitetura

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Interface Web   |<--->|  API REST (PHP)  |<--->|  Armazenamento   |
|  (HTML/CSS/JS)   |     |                  |     |  (JSON Files)    |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
        ^                        ^                        ^
        |                        |                        |
        v                        v                        v
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Componentes UI  |     |  Gerenciadores   |     |  Contêiner       |
|  (Modais,        |     |  (Produtos,      |     |  Docker          |
|   Carrossel)     |     |   Categorias)    |     |                  |
|                  |     |                  |     |                  |
+------------------+     +------------------+     +------------------+
```

### 2.4 Padrões de Design

O projeto utiliza múltiplos padrões de arquitetura:

- **MVC Simplificado**: Separação entre visualização (HTML/CSS), controladores (JavaScript) e modelo (dados JSON)
- **API REST**: Endpoints para manipulação de dados no servidor
- **Gerenciadores de Estado**: Classes como `ProductManager`, `CategoryManager` e `CartManager` que encapsulam a lógica de negócios
- **Componentes de UI**: Funções para renderização e manipulação de elementos da interface
- **Eventos e Callbacks**: Sistema de eventos para comunicação entre componentes
- **Persistência de Dados**: Utilização de arquivos JSON no servidor para armazenamento persistente
- **Conteinerização**: Isolamento da aplicação em contêineres Docker para fácil implantação

## 3. Banco de Dados

### 3.1 Modelo de Dados

O sistema utiliza arquivos JSON no servidor como banco de dados, com os seguintes modelos principais:

#### 3.1.1 Produto

```json
{
  "id": 1,
  "name": "Nome do Produto",
  "description": "Descrição detalhada do produto",
  "price": 99.90,
  "stock": 10,
  "categoryId": "cat1",
  "image": "img/produto.jpg",
  "featured": true,
  "sale": false,
  "salePrice": 0
}
```

#### 3.1.2 Categoria

```json
{
  "id": "cat1",
  "name": "Nome da Categoria",
  "parentId": null
}
```

#### 3.1.3 Item do Carrinho

```json
{
  "sessionId": "session_uniqueid",
  "items": [
    {
      "id": 1,
      "name": "Nome do Produto",
      "price": 99.90,
      "image": "img/produto.jpg",
      "quantity": 2
    }
  ]
}
```

#### 3.1.4 Slide do Carrossel

```json
{
  "id": 1,
  "title": "Título do Slide",
  "subtitle": "Subtítulo do slide",
  "buttonText": "Texto do botão",
  "buttonLink": "link-do-botao",
  "image": "url-da-imagem",
  "order": 1
}
```

### 3.2 Relacionamentos

- **Produto → Categoria**: Um produto pertence a uma categoria (relação 1:N)
- **Categoria → Subcategoria**: Uma categoria pode ter múltiplas subcategorias (relação 1:N)
- **Carrinho → Produto**: Um carrinho contém múltiplos produtos (relação N:M)
- **Sessão → Carrinho**: Uma sessão de usuário pode ter um carrinho (relação 1:1)

### 3.3 Esquema de Armazenamento

O sistema utiliza os seguintes arquivos JSON para armazenamento de dados:

- `server/data/products.json`: Array de objetos de produtos
- `server/data/categories.json`: Array de objetos de categorias
- `server/data/cart.json`: Array de objetos de carrinhos, indexados por sessionId
- `server/data/carousel.json`: Array de objetos de slides do carrossel

### 3.4 Exemplos de Operações via API

#### Buscar todos os produtos
```javascript
// Utilizando a API para obter produtos
const products = await ApiService.fetchProducts();
```

#### Buscar produtos por categoria
```javascript
// Utilizando a API para obter produtos de uma categoria
const categoryProducts = await ApiService.fetchProductsByCategory(categoryId);
```

#### Adicionar produto ao carrinho
```javascript
// Utilizando a API para adicionar ao carrinho
await ApiService.addToCart({
  productId: product.id,
  quantity: 1,
  sessionId: sessionId
});
```

## 4. API e Integrações

### 4.1 API REST

O sistema implementa uma API REST através de endpoints PHP:

#### 4.1.1 Produtos

- `GET /server/products.php`: Retorna todos os produtos
- `GET /server/products.php?id=X`: Retorna um produto específico
- `GET /server/products.php?category=X`: Retorna produtos de uma categoria
- `POST /server/products.php`: Cria um novo produto
- `PUT /server/products.php`: Atualiza um produto existente
- `DELETE /server/products.php?id=X`: Remove um produto

#### 4.1.2 Categorias

- `GET /server/categories.php`: Retorna todas as categorias
- `GET /server/categories.php?id=X`: Retorna uma categoria específica
- `POST /server/categories.php`: Cria uma nova categoria
- `PUT /server/categories.php`: Atualiza uma categoria existente
- `DELETE /server/categories.php?id=X`: Remove uma categoria

#### 4.1.3 Carrinho

- `GET /server/cart.php?sessionId=X`: Retorna o carrinho de uma sessão
- `POST /server/cart.php`: Adiciona um item ao carrinho
- `PUT /server/cart.php`: Atualiza um item do carrinho
- `DELETE /server/cart.php`: Remove um item do carrinho
- `DELETE /server/cart.php?sessionId=X&clear=true`: Limpa o carrinho

#### 4.1.4 Carrossel

- `GET /server/carousel.php`: Retorna todos os slides do carrossel
- `POST /server/carousel.php`: Cria um novo slide
- `PUT /server/carousel.php`: Atualiza um slide existente
- `DELETE /server/carousel.php?id=X`: Remove um slide

### 4.2 Serviço de API JavaScript

O frontend se comunica com o backend através do módulo `ApiService`:

```javascript
// Classe de serviço para comunicação com a API
class ApiService {
    // Obter todos os produtos
    static async fetchProducts() {
        const response = await fetch('/server/products.php');
        return await response.json();
    }
    
    // Obter produto por ID
    static async fetchProductById(id) {
        const response = await fetch(`/server/products.php?id=${id}`);
        return await response.json();
    }
    
    // Adicionar ao carrinho
    static async addToCart(data) {
        const response = await fetch('/server/cart.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
    
    // Outros métodos para interação com a API...
}
```

### 4.3 Integrações Externas

O sistema não possui integrações externas ativas, mas está preparado para futuras integrações através da estrutura de API e configurações de CORS.

## 5. Conteinerização e Deploy

### 5.1 Docker

O projeto utiliza Docker para conteinerização, facilitando a implantação e execução em diferentes ambientes.

#### 5.1.1 Dockerfile

```dockerfile
FROM php:7.4-apache

# Configuração do diretório raiz do Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html

# Atualiza a configuração do Apache
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Habilita o módulo rewrite
RUN a2enmod rewrite

# Cria diretórios para dados e configura permissões
RUN mkdir -p /var/www/html/server/data && \
    chown -R www-data:www-data /var/www/html

# Instala extensões PHP
RUN docker-php-ext-install opcache

# Configura timezone
RUN echo "date.timezone = America/Sao_Paulo" > /usr/local/etc/php/conf.d/timezone.ini

# Expõe a porta 80
EXPOSE 80
```

#### 5.1.2 Docker Compose

```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - .:/var/www/html
    restart: always
    environment:
      - APACHE_DOCUMENT_ROOT=/var/www/html
networks:
  default:
    name: apoioentrega-network
    driver: bridge
```

### 5.2 Scripts de Execução

#### 5.2.1 start-apoioentrega.bat

Script para iniciar a aplicação em ambientes Windows:

```bat
@echo off
echo ========================================
echo Iniciando Apoio Entrega E-commerce
echo ========================================

REM Verifica se o Docker está instalado
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: Docker nao esta instalado ou nao esta no PATH.
    echo Por favor, instale o Docker Desktop antes de continuar.
    goto :EOF
)

REM Verifica se o Docker Compose está instalado
WHERE docker-compose >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: Docker Compose nao esta instalado ou nao esta no PATH.
    echo Por favor, instale o Docker Compose antes de continuar.
    goto :EOF
)

echo Construindo e iniciando os containers Docker...
docker-compose up -d --build

IF %ERRORLEVEL% NEQ 0 (
    echo Erro ao iniciar os containers. Verifique se as portas necessarias estao disponiveis.
) ELSE (
    echo ========================================
    echo Aplicacao iniciada com sucesso!
    echo Acesse: http://localhost:8080
    echo Para parar os servidores, execute stop-apoioentrega.bat
    echo ========================================
)
```

#### 5.2.2 stop-apoioentrega.bat

Script para parar a aplicação em ambientes Windows:

```bat
@echo off
echo ========================================
echo Parando Apoio Entrega E-commerce
echo ========================================

REM Verifica se o Docker está instalado
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Erro: Docker nao esta instalado ou nao esta no PATH.
    goto :EOF
)

echo Parando os containers Docker...
docker-compose down

echo ========================================
echo Containers parados com sucesso!
echo ========================================
```

## 6. Melhorias e Correções Implementadas

### 6.1 Correções de Erros no Admin

#### 6.1.1 Função de Pedidos Ausente

Foi implementada a função `initOrdersSection()` que estava ausente no código, causando erros quando o usuário tentava acessar a seção de pedidos:

```javascript
async function initOrdersSection() {
    console.log("Seção de pedidos inicializada");
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="section-message">Funcionalidade de pedidos em desenvolvimento.</div>';
}
```

#### 6.1.2 Correção de Imagens Ausentes

Foram adicionadas as imagens ausentes no diretório `/img`:

- suporte-celular.jpg
- maquina-cartao.jpg
- jaqueta.jpg
- caixa-termica.jpg
- power-bank.jpg
- marca_apoio_entrega@2x.png

#### 6.1.3 Substituição de Serviço de Placeholder

As referências ao serviço externo `via.placeholder.com` (que estava indisponível) foram substituídas por `placehold.co` nas funções:

- `loadCarouselItems()`
- `openCarouselModal()`
- `saveCarouselItem()`

```javascript
// Exemplo de substituição:
let displayUrl = imageUrl;
if (imageUrl && imageUrl.includes('via.placeholder.com')) {
    displayUrl = imageUrl.replace('via.placeholder.com', 'placehold.co');
}
```

#### 6.1.4 Estilização para Mensagens de Desenvolvimento

Foi adicionado CSS para estilizar mensagens de funcionalidades em desenvolvimento:

```css
.section-message {
    padding: 20px;
    margin: 20px 0;
    background-color: #f8f9fa;
    border-radius: 5px;
    border-left: 5px solid #6c757d;
    font-size: 16px;
    color: #495057;
    text-align: center;
}
```

### 6.2 Migração para Backend PHP

#### 6.2.1 Estrutura de Arquivos JSON

Foi implementada uma estrutura de armazenamento de dados em arquivos JSON no servidor:

- `server/data/products.json`: Produtos do e-commerce
- `server/data/categories.json`: Categorias de produtos
- `server/data/cart.json`: Carrinhos de compras
- `server/data/carousel.json`: Slides do carrossel

#### 6.2.2 Endpoints da API

Foram implementados endpoints PHP para gerenciamento dos dados:

- `server/products.php`: Gerenciamento de produtos
- `server/categories.php`: Gerenciamento de categorias
- `server/cart.php`: Gerenciamento do carrinho
- `server/carousel.php`: Gerenciamento do carrossel

#### 6.2.3 Migração do Cliente

O frontend foi modificado para utilizar a API PHP em vez do armazenamento local:

- Adição do arquivo `js/api.js` com a classe `ApiService`
- Modificação das classes gerenciadoras para utilizar o `ApiService`
- Manutenção da mesma interface para garantir compatibilidade

### 6.3 Configuração para Produção

#### 6.3.1 CORS e Headers HTTP

Foi adicionado um arquivo `.htaccess` para configurar o servidor web:

```apache
# Habilita o módulo de rewrite
RewriteEngine On

# Headers CORS para permitir acesso de qualquer origem
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"

# Lidando com requisições OPTIONS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Proteção de arquivos e diretórios
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Permitir acesso aos scripts PHP
<Files "*.php">
    Order allow,deny
    Allow from all
</Files>

# Definir o índice padrão
DirectoryIndex index.html index.php
```

## 7. Instruções de Instalação e Execução

### 7.1 Requisitos de Sistema

Para execução com Docker:
- Docker Engine 19.03.0+
- Docker Compose 1.27.0+
- 2GB de RAM disponível
- 1GB de espaço em disco
- Portas 8080 disponíveis

Para execução manual:
- PHP 7.4 ou superior
- Servidor web (Apache, Nginx)
- Navegador web moderno

### 7.2 Instalação com Docker

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/apoio-entrega.git
   cd apoio-entrega
   ```

2. **Inicialização no Windows**
   ```bash
   start-apoioentrega.bat
   ```

3. **Inicialização manual com Docker**
   ```bash
   docker-compose up -d
   ```

4. **Acesso**
   - Frontend: http://localhost:8080
   - Painel administrativo: http://localhost:8080/admin.html

### 7.3 Instalação Manual

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/apoio-entrega.git
   cd apoio-entrega
   ```

2. **Inicie o servidor PHP**
   ```bash
   php -S localhost:8080
   ```

3. **Acesso**
   - Frontend: http://localhost:8080
   - Painel administrativo: http://localhost:8080/admin.html

## 8. Considerações para Desenvolvimento Futuro

### 8.1 Melhorias Sugeridas

- Implementação de sistema de autenticação para o painel administrativo
- Integração com gateway de pagamento real
- Criação de API para usuários e perfis
- Sistema de avaliação de produtos
- Histórico de pedidos e rastreamento
- Geração de relatórios e dashboard analítico
- Otimização de imagens e cache de recursos

### 8.2 Escalabilidade

- Migração para banco de dados relacional ou NoSQL
- Implementação de cache distribuído (Redis/Memcached)
- Balanceamento de carga para alta disponibilidade
- CDN para distribuição de ativos estáticos
- Separação do backend em microserviços

## 9. Conclusão

O E-commerce Apoio Entrega evoluiu de um sistema baseado em armazenamento local para uma aplicação completa com backend PHP, persistência de dados em servidor e conteinerização com Docker. As correções implementadas tornaram o sistema mais robusto e pronto para uso em ambiente de produção.

A arquitetura atual permite fácil manutenção e escalabilidade, com separação clara entre frontend e backend através de uma API REST. A documentação fornecida serve como guia abrangente para desenvolvedores que desejam entender, manter ou expandir o sistema. 