/**
 * Classe para gerenciar a comunicação com a API
 */
class ApiService {
    constructor(baseUrl = 'server') {
        // Verifica se a aplicação está rodando no ambiente de produção ou local
        const isProduction = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('127.0.0.1');
        
        if (isProduction) {
            // Em produção, usa a URL relativa
            this.baseUrl = baseUrl;
        } else {
            // Em ambiente local, usa a URL completa do servidor local
            this.baseUrl = baseUrl;
        }
        
        this.sessionId = this.getOrCreateSessionId();
        this.defaultTimeout = 10000; // 10 segundos
    }
    
    /**
     * Obtém ou cria um ID de sessão para o usuário
     * @returns {string} ID de sessão
     */
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('sessionId');
        
        if (!sessionId) {
            // Gera um ID de sessão aleatório
            sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('sessionId', sessionId);
        }
        
        return sessionId;
    }
    
    /**
     * Faz uma requisição para a API
     * @param {string} endpoint - Endpoint da API
     * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
     * @param {Object} data - Dados para enviar
     * @param {Object} params - Parâmetros de URL
     * @param {Object} additionalHeaders - Headers HTTP adicionais
     * @returns {Promise<Object>} - Resposta da API
     */
    async request(endpoint, method = 'GET', data = null, params = {}, additionalHeaders = {}) {
        // Corrige a construção da URL para garantir que ela está sendo formada corretamente
        let apiUrl = '';
        
        // Verifica se o endpoint já tem http ou https (URL completa)
        if (endpoint.startsWith('http')) {
            apiUrl = endpoint;
        } else {
            // Garante que há apenas uma barra entre baseUrl e endpoint
            const baseWithSlash = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
            const endpointWithoutSlash = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
            apiUrl = `${window.location.origin}/${baseWithSlash}${endpointWithoutSlash}`;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
        
        console.log(`Enviando requisição ${method} para: ${apiUrl}`);
        
        // Adiciona parâmetros à URL
        const url = new URL(apiUrl);
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    url.searchParams.append(key, params[key]);
                }
            });
        }
        
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    ...additionalHeaders
                },
                signal: controller.signal
            };
            
            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url.toString(), options);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorMessage = `Erro na resposta: ${response.status} ${response.statusText}`;
                console.error(errorMessage);
                
                // Tenta ler o corpo da resposta para mais detalhes
                try {
                    const errorBody = await response.text();
                    console.error('Detalhes do erro:', errorBody);
                    throw new Error(`${errorMessage} - ${errorBody}`);
                } catch (e) {
                    throw new Error(errorMessage);
                }
            }
            
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`Erro na requisição para ${endpoint} (${method}):`, error);
            
            // Fornece mensagem de erro mais detalhada
            if (error.name === 'AbortError') {
                throw new Error(`Requisição para ${endpoint} excedeu o tempo limite`);
            } else {
                throw new Error(`Erro na requisição para ${endpoint}: ${error.message}`);
            }
        }
    }
    
    /**
     * Garante que o resultado seja um array
     * @param {Function} requestFn - Função de requisição que retorna uma Promise
     * @param {Array} fallbackData - Dados de fallback para retornar em caso de erro
     * @returns {Promise<Array>} Array garantido, mesmo em caso de erro
     */
    async ensureArray(requestFn, fallbackData = []) {
        try {
            const result = await requestFn();
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Erro ao obter dados:', error);
            return fallbackData;
        }
    }
    
    // Métodos específicos para produtos
    
    /**
     * Obtém todos os produtos
     * @returns {Promise<Array>} Lista de produtos
     */
    async getAllProducts() {
        const fallbackProducts = [
            {
                id: 1,
                name: "Mochila para Entregador",
                description: "Mochila resistente ideal para entregas, com compartimentos térmicos",
                price: 149.90,
                stock: 25,
                categoryId: "cat1",
                isNew: true,
                sale: false,
                salePrice: null,
                image: "https://placehold.co/500x500/4a90e2/ffffff?text=Mochila+para+Entregador"
            },
            {
                id: 2,
                name: "Bag Térmica 45 Litros",
                description: "Bag térmica com capacidade de 45L, ideal para entregas de alimentos",
                price: 99.90,
                stock: 15,
                categoryId: "cat1",
                isNew: true,
                sale: true,
                salePrice: 89.90,
                image: "https://placehold.co/500x500/f5a623/ffffff?text=Bag+Térmica+45L"
            },
            {
                id: 3,
                name: "Capacete para Motociclista",
                description: "Capacete certificado com viseira de proteção UV",
                price: 189.90,
                stock: 10,
                categoryId: "cat2",
                isNew: false,
                sale: false,
                salePrice: null,
                image: "https://placehold.co/500x500/28a745/ffffff?text=Capacete+Motociclista"
            }
        ];
        
        return this.ensureArray(() => this.request('products.php'), fallbackProducts);
    }
    
    /**
     * Obtém um produto pelo ID
     * @param {number} id - ID do produto
     * @returns {Promise<Object>} Produto
     */
    async getProductById(id) {
        return this.request('products.php', 'GET', null, { id });
    }
    
    /**
     * Obtém produtos por categoria
     * @param {string|number} categoryId - ID da categoria
     * @returns {Promise<Array>} Lista de produtos
     */
    async getProductsByCategory(categoryId) {
        return this.ensureArray(() => this.request('products.php', 'GET', null, { category: categoryId }));
    }
    
    /**
     * Busca produtos por termo
     * @param {string} searchTerm - Termo de busca
     * @returns {Promise<Array>} Lista de produtos
     */
    async searchProducts(searchTerm) {
        return this.request('products.php', 'GET', null, { search: searchTerm });
    }
    
    /**
     * Adiciona um novo produto
     * @param {Object} product - Dados do produto
     * @returns {Promise<Object>} Produto adicionado
     */
    async addProduct(product) {
        return this.request('products.php', 'POST', product);
    }
    
    /**
     * Atualiza um produto existente
     * @param {Object} product - Dados do produto
     * @returns {Promise<Object>} Produto atualizado
     */
    async updateProduct(product) {
        return this.request('products.php', 'PUT', product);
    }
    
    /**
     * Remove um produto
     * @param {number} id - ID do produto
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteProduct(id) {
        return this.request('products.php', 'DELETE', null, { id });
    }
    
    // Métodos específicos para categorias
    
    /**
     * Obtém todas as categorias
     * @returns {Promise<Array>} Lista de categorias
     */
    async getAllCategories() {
        try {
            // Adiciona parâmetro de timestamp para evitar cache
            const timestamp = Date.now();
            const apiCategories = await this.request('categories.php', 'GET', null, { timestamp });
            
            if (Array.isArray(apiCategories) && apiCategories.length > 0) {
                // Armazena no localStorage apenas para fallback, não como fonte primária
                try {
                    localStorage.setItem('localCategories', JSON.stringify(apiCategories));
                    localStorage.setItem('categoriesLastUpdate', timestamp.toString());
                } catch (e) {
                    console.warn('Erro ao salvar categorias no localStorage:', e);
                }
                return apiCategories;
            }
            
            // Retorna os dados de fallback apenas se não houver dados da API
            return this.getCategoryFallbackData();
        } catch (error) {
            console.warn('Erro ao obter categorias da API, usando fallback:', error);
            return this.getCategoryFallbackData();
        }
    }
    
    /**
     * Obtém dados de categorias de fallback (localStorage ou padrão)
     * @private
     * @returns {Array} Categorias de fallback
     */
    getCategoryFallbackData() {
        const fallbackCategories = [
            {
                id: "cat1",
                name: "Bags e Mochilas",
                parentId: null
            },
            {
                id: "cat2",
                name: "Equipamentos de Proteção",
                parentId: null
            },
            {
                id: "cat3",
                name: "Acessórios",
                parentId: null
            },
            {
                id: "cat4",
                name: "Peças e Componentes",
                parentId: null
            }
        ];
        
        try {
            const lastUpdate = parseInt(localStorage.getItem('categoriesLastUpdate') || '0');
            const now = Date.now();
            // Se os dados locais têm menos de 5 minutos, usa-os
            if (now - lastUpdate < 300000) {
                const localCategories = JSON.parse(localStorage.getItem('localCategories') || '[]');
                if (Array.isArray(localCategories) && localCategories.length > 0) {
                    return localCategories;
                }
            }
        } catch (e) {
            console.error('Erro ao ler categorias de localStorage:', e);
        }
        
        return fallbackCategories;
    }
    
    /**
     * Obtém uma categoria pelo ID
     * @param {string|number} id - ID da categoria
     * @returns {Promise<Object>} Categoria
     */
    async getCategoryById(id) {
        return this.request('categories.php', 'GET', null, { id });
    }
    
    /**
     * Obtém categorias principais
     * @returns {Promise<Array>} Lista de categorias principais
     */
    async getMainCategories() {
        return this.request('categories.php', 'GET', null, { mainCategories: 'true' });
    }
    
    /**
     * Obtém subcategorias
     * @param {string|number} parentId - ID da categoria pai
     * @returns {Promise<Array>} Lista de subcategorias
     */
    async getSubcategories(parentId) {
        return this.request('categories.php', 'GET', null, { parent: parentId });
    }
    
    /**
     * Adiciona uma nova categoria
     * @param {Object} category - Dados da categoria
     * @returns {Promise<Object>} Categoria adicionada
     */
    async addCategory(category) {
        try {
            console.log('Iniciando adicionar categoria:', category);
            
            // Adiciona timestamp para forçar recarregamento e evitar cache
            const timestamp = Date.now();
            const headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            
            // Preparar os dados, garantindo que o campo name está presente
            const categoryData = {
                ...category,
                timestamp,
                name: category.name?.trim() || ''
            };
            
            console.log('Enviando dados para adicionar categoria:', categoryData);
            
            // Faz a requisição POST
            const result = await this.request('categories.php', 'POST', categoryData, {}, headers);
            
            console.log('Categoria adicionada com sucesso:', result);
            
            // Força recarregamento de categorias após adicionar
            setTimeout(() => {
                // Disparar evento de atualização
                window.dispatchEvent(new CustomEvent('categories-updated', {
                    detail: { action: 'add', category: result }
                }));
            }, 100);
            
            return result;
        } catch (error) {
            console.error('Erro ao adicionar categoria:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza uma categoria existente
     * @param {Object} category - Dados da categoria
     * @returns {Promise<Object>} Categoria atualizada
     */
    async updateCategory(category) {
        try {
            // Adiciona timestamp para forçar recarregamento e evitar cache
            const timestamp = Date.now();
            const headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            
            const result = await this.request('categories.php', 'PUT', {...category, timestamp}, {}, headers);
            
            // Força recarregamento de categorias após atualizar
            setTimeout(() => {
                // Disparar evento de atualização
                window.dispatchEvent(new CustomEvent('categories-updated', {
                    detail: { action: 'update', category: result }
                }));
            }, 100);
            
            return result;
        } catch (error) {
            console.warn('Erro ao atualizar categoria:', error);
            throw error;
        }
    }
    
    /**
     * Exclui uma categoria
     * @param {string|number} id - ID da categoria
     * @param {boolean} updateSubcategories - Se deve atualizar subcategorias
     * @param {string|number} newParentId - Novo ID de categoria pai para subcategorias
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteCategory(id, updateSubcategories = false, newParentId = null) {
        const params = { 
            id,
            timestamp: Date.now(), // Adiciona timestamp para forçar recarregamento e evitar cache
        };
        
        if (updateSubcategories) {
            params.updateSubcategories = 'true';
            if (newParentId) {
                params.newParentId = newParentId;
            }
        }
        
        try {
            console.log(`Tentando excluir categoria: ${id}`);
            
            const headers = {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };
            
            const result = await this.request('categories.php', 'DELETE', null, params, headers);
            
            console.log(`Categoria excluída com sucesso: ${id}`, result);
            
            // Força recarregamento de categorias após deletar
            setTimeout(() => {
                // Disparar evento de atualização
                window.dispatchEvent(new CustomEvent('categories-updated', {
                    detail: { action: 'delete', categoryId: id }
                }));
            }, 100);
            
            return result;
        } catch (error) {
            console.error(`Erro ao excluir categoria ${id}:`, error);
            throw error;
        }
    }
    
    // Métodos específicos para o carrinho
    
    /**
     * Obtém os itens do carrinho
     * @returns {Promise<Array>} Lista de itens do carrinho
     */
    async getCartItems() {
        return this.request('cart.php');
    }
    
    /**
     * Adiciona um item ao carrinho
     * @param {Object} item - Item a ser adicionado
     * @returns {Promise<Object>} Resposta da API
     */
    async addToCart(item) {
        return this.request('cart.php', 'POST', item);
    }
    
    /**
     * Atualiza a quantidade de um item no carrinho
     * @param {number} id - ID do item
     * @param {number} quantity - Nova quantidade
     * @returns {Promise<Object>} Resposta da API
     */
    async updateCartQuantity(id, quantity) {
        return this.request('cart.php', 'PUT', { id, quantity });
    }
    
    /**
     * Remove um item do carrinho
     * @param {number} id - ID do item
     * @returns {Promise<Object>} Resposta da API
     */
    async removeFromCart(id) {
        return this.request('cart.php', 'DELETE', null, { id });
    }
    
    /**
     * Limpa o carrinho
     * @returns {Promise<Object>} Resposta da API
     */
    async clearCart() {
        return this.request('cart.php', 'DELETE', null, { clear: 'true' });
    }
    
    // Métodos específicos para o carrossel
    
    /**
     * Obtém todos os slides do carrossel
     * @returns {Promise<Array>} Lista de slides
     */
    async getCarouselSlides() {
        return this.ensureArray(() => this.request('carousel.php'));
    }
    
    /**
     * Obtém um slide pelo ID
     * @param {number} id - ID do slide
     * @returns {Promise<Object>} Slide
     */
    async getSlideById(id) {
        return this.request('carousel.php', 'GET', null, { id });
    }
    
    /**
     * Adiciona um novo slide
     * @param {Object} slide - Dados do slide
     * @returns {Promise<Object>} Slide adicionado
     */
    async addSlide(slide) {
        return this.request('carousel.php', 'POST', slide);
    }
    
    /**
     * Atualiza um slide existente
     * @param {Object} slide - Dados do slide
     * @returns {Promise<Object>} Slide atualizado
     */
    async updateSlide(slide) {
        return this.request('carousel.php', 'PUT', slide);
    }
    
    /**
     * Remove um slide
     * @param {number} id - ID do slide
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteSlide(id) {
        return this.request('carousel.php', 'DELETE', null, { id });
    }
    
    /**
     * Realiza upload de uma imagem para o servidor
     * @param {File} file - Arquivo de imagem
     * @returns {Promise<string>} Caminho da imagem no servidor
     */
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const url = `${this.baseUrl}/upload.php`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Erro ao fazer upload da imagem');
            }
            
            const result = await response.json();
            return result.imagePath;
        } catch (error) {
            console.error('Erro no upload da imagem:', error);
            throw error;
        }
    }
}

// Cria uma instância global da API
const apiService = new ApiService();
// Também define api como global para compatibilidade
window.api = apiService;
window.apiService = apiService; 