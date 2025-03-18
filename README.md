# Apoio Entrega - E-commerce

Este é um e-commerce desenvolvido para a venda de produtos relacionados a entregas e logística, focado principalmente em equipamentos e acessórios para entregadores.

## Requisitos

Para executar com Docker:
- Docker
- Docker Compose

Para execução sem Docker:
- PHP 7.4 ou superior
- Servidor web (Apache, Nginx, ou servidor embutido do PHP)
- Navegador moderno (Chrome, Firefox, Edge, Safari)

## Instalação e Execução com Docker (Recomendado)

### No Windows
Simplesmente execute o arquivo batch:
```
start-apoioentrega.bat
```

Para parar:
```
stop-apoioentrega.bat
```

### Manualmente com Docker
1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/apoioentrega.git
   cd apoioentrega
   ```

2. Construa e inicie os containers:
   ```
   docker-compose up -d --build
   ```

3. Acesse no navegador:
   ```
   http://localhost:8080
   ```

4. Para parar:
   ```
   docker-compose down
   ```

## Instalação sem Docker

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/apoioentrega.git
   cd apoioentrega
   ```

2. Inicie o servidor PHP:
   ```
   # Usando o servidor embutido do PHP
   php -S localhost:8000
   ```

3. Acesse no navegador:
   ```
   http://localhost:8000
   ```

## Estrutura do Projeto

- `/css` - Arquivos CSS
- `/js` - Arquivos JavaScript
- `/img` - Imagens do site
- `/data` - Arquivos JSON iniciais
- `/server` - Backend PHP
  - `/server/data` - Armazenamento JSON no servidor

## Migrations

Este projeto foi atualizado para utilizar armazenamento de dados em arquivos JSON no servidor em vez de localStorage. Isso proporciona:

1. **Persistência Real** - Os dados ficam salvos permanentemente em arquivos JSON no servidor
2. **Acessibilidade Global** - Todos os usuários veem os mesmos produtos e categorias
3. **Escalabilidade Simples** - Continua usando JSON, mas com armazenamento centralizado
4. **Facilidade de Backup** - Os arquivos JSON podem ser facilmente copiados

## API

O projeto agora implementa uma API RESTful para gerenciamento de dados:

### Endpoints

- `/server/products.php` - Gerenciamento de produtos
- `/server/categories.php` - Gerenciamento de categorias
- `/server/cart.php` - Gerenciamento do carrinho de compras
- `/server/carousel.php` - Gerenciamento do carrossel

### Métodos

- `GET` - Obter dados
- `POST` - Adicionar dados
- `PUT` - Atualizar dados
- `DELETE` - Remover dados

## Uso

- **Página Principal**: http://localhost:8080
- **Painel Administrativo**: http://localhost:8080/admin.html
- **Página Sobre**: http://localhost:8080/sobre.html
- **Página de Contato**: http://localhost:8080/contato.html

## Configuração do Docker

A configuração do Docker consiste em:
1. **Dockerfile**: Configura o ambiente PHP/Apache
2. **docker-compose.yml**: Orquestra o serviço web
3. **Arquivos .bat**: Facilitam a execução no Windows 