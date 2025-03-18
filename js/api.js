/**
 * Classe para gerenciar a comunicação com a API
 */
class ApiService {
    constructor(baseUrl = 'server') {
        this.baseUrl = baseUrl;
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
     * Realiza uma requisição HTTP
     * @param {string} endpoint - Endpoint da API
     * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
     * @param {Object} data - Dados a serem enviados
     * @param {Object} params - Parâmetros de query string
     * @returns {Promise<Object>} Resposta da API
     */
    async request(endpoint, method = 'GET', data = null, params = {}) {
        // Adiciona o sessionId nos parâmetros para endpoints que precisam
        if (endpoint === 'cart.php') {
            params.sessionId = this.sessionId;
        }
        
        // Constrói a URL com os parâmetros
        let url = `${this.baseUrl}/${endpoint}`;
        
        if (Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams();
            for (const key in params) {
                queryParams.append(key, params[key]);
            }
            url += `?${queryParams.toString()}`;
        }
        
        // Configura a requisição
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Adiciona o corpo da requisição para métodos que aceitam dados
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            // Cria um timeout para a requisição
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
            options.signal = controller.signal;
            
            // Realiza a requisição
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            
            // Verifica se a resposta é JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                
                // Verifica se houve erro
                if (!response.ok) {
                    throw new Error(result.error || 'Erro na requisição');
                }
                
                return result;
            } else {
                // Resposta não é JSON
                if (!response.ok) {
                    throw new Error('Erro na requisição');
                }
                
                return await response.text();
            }
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
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
        
        return this.ensureArray(() => this.request('categories.php'), fallbackCategories);
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
            return await this.request('categories.php', 'POST', category);
        } catch (error) {
            console.warn('Erro ao adicionar categoria via API, usando fallback local:', error);
            
            // Fallback: simula adição local quando a API falha
            const allCategories = await this.getAllCategories();
            const newCategory = {
                ...category,
                id: 'cat' + (Date.now() % 10000), // Gera um ID único
                createdAt: new Date().toISOString()
            };
            
            // Tenta salvar no localStorage como fallback
            try {
                const localCategories = JSON.parse(localStorage.getItem('localCategories') || '[]');
                localCategories.push(newCategory);
                localStorage.setItem('localCategories', JSON.stringify(localCategories));
            } catch (storageError) {
                console.error('Erro ao salvar categoria no localStorage:', storageError);
            }
            
            return newCategory;
        }
    }
    
    /**
     * Atualiza uma categoria existente
     * @param {Object} category - Dados da categoria
     * @returns {Promise<Object>} Categoria atualizada
     */
    async updateCategory(category) {
        return this.request('categories.php', 'PUT', category);
    }
    
    /**
     * Remove uma categoria
     * @param {string|number} id - ID da categoria
     * @param {boolean} updateSubcategories - Se deve atualizar subcategorias
     * @param {string|number} newParentId - Novo ID de categoria pai para subcategorias
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteCategory(id, updateSubcategories = false, newParentId = null) {
        const params = { id };
        
        if (updateSubcategories) {
            params.updateSubcategories = 'true';
            if (newParentId) {
                params.newParentId = newParentId;
            }
        }
        
        return this.request('categories.php', 'DELETE', null, params);
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