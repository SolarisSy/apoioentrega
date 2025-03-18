/**
 * Classe para gerenciar a comunicação com a API
 */
class ApiService {
    constructor(baseUrl = 'server') {
        this.baseUrl = baseUrl;
        this.sessionId = this.getOrCreateSessionId();
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
            // Realiza a requisição
            const response = await fetch(url, options);
            
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
    
    // Métodos específicos para produtos
    
    /**
     * Obtém todos os produtos
     * @returns {Promise<Array>} Lista de produtos
     */
    async getAllProducts() {
        return this.request('products.php');
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
        return this.request('products.php', 'GET', null, { category: categoryId });
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
        return this.request('categories.php');
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
        return this.request('categories.php', 'POST', category);
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
        return this.request('carousel.php');
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