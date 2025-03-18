/**
 * Classe para gerenciar a comunicação com a API
 */
class ApiService {
    constructor(baseUrl = 'server') {
        // Verifica se já existe uma instância global para evitar duplicação
        if (window.apiServiceInstance) {
            console.log('Usando instância existente de ApiService');
            return window.apiServiceInstance;
        }
        
        // Verifica se a aplicação está rodando no ambiente de produção ou local
        const isProduction = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('127.0.0.1');
        
        if (isProduction) {
            // Em produção, usa a URL relativa sem o prefixo /server
            this.baseUrl = '';
        } else {
            // Em ambiente local, usa o baseUrl configurado
            this.baseUrl = baseUrl;
        }
        
        this.sessionId = this.getOrCreateSessionId();
        this.defaultTimeout = 30000; // Aumentado para 30 segundos
        this.pendingRequests = {}; // Para armazenar e cancelar requisições pendentes
        
        // Armazena globalmente para reutilizar
        window.apiServiceInstance = this;
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
        // Simplificar a construção de URL para evitar problemas
        let url;
        
        // Construir URL completa
        const isProduction = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('127.0.0.1');
        
        if (isProduction) {
            // Em produção, usar URL direta do domínio
            url = new URL(`${window.location.origin}/${endpoint}`, window.location.origin);
        } else {
            // Em desenvolvimento, incluir o caminho do servidor
            const fullPath = `${window.location.origin}/${this.baseUrl}/${endpoint}`;
            url = new URL(fullPath);
        }
        
        // Adicionar parâmetros à URL
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    url.searchParams.append(key, params[key]);
                }
            });
        }
        
        const urlString = url.toString();
        console.log(`Enviando requisição ${method} para: ${urlString}`);
        
        // Cancelar requisições pendentes duplicadas (para o mesmo endpoint e método)
        const requestKey = `${method}-${urlString}`;
        if (this.pendingRequests[requestKey]) {
            console.log(`Cancelando requisição anterior para ${requestKey}`);
            this.pendingRequests[requestKey].abort();
        }
        
        // Criar novo controlador para esta requisição
        const controller = new AbortController();
        this.pendingRequests[requestKey] = controller;
        
        // Configura o tempo limite
        const timeoutId = setTimeout(() => {
            console.warn(`Tempo limite excedido para ${urlString}, abortando...`);
            controller.abort();
        }, this.defaultTimeout);
        
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
            
            // Adicionar corpo para requisições POST e PUT
            if (data !== null && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
                console.log(`Dados enviados no ${method}:`, JSON.stringify(data));
            }
            
            const response = await fetch(urlString, options);
            
            // Limpar o timeout e referência à requisição
            clearTimeout(timeoutId);
            delete this.pendingRequests[requestKey];
            
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
            
            // Se o tipo de conteúdo for JSON, converte a resposta para objeto
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                // Tenta converter para JSON mesmo assim, caso o servidor não envie o header correto
                try {
                    return JSON.parse(text);
                } catch (e) {
                    // Se não for JSON, retorna o texto
                    return text;
                }
            }
        } catch (error) {
            // Limpar o timeout e referência à requisição
            clearTimeout(timeoutId);
            delete this.pendingRequests[requestKey];
            
            console.error(`Erro na requisição para ${urlString} (${method}):`, error);
            
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
            const result = await this.requestWithRetry(requestFn, 2);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.error('Erro ao obter dados, usando fallback:', error);
            return fallbackData;
        }
    }
    
    // Métodos específicos para produtos
    
    /**
     * Obtém todos os produtos
     * @param {boolean} useCache - Se deve usar cache quando disponível
     * @returns {Promise<Array>} Lista de produtos
     */
    async getAllProducts(useCache = true) {
        // Verifica se temos produtos em cache e se devemos usá-los
        if (useCache && this.productsCache) {
            console.log('Usando produtos em cache');
            return this.productsCache;
        }
        
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
        
        try {
            const products = await this.requestWithRetry(
                () => this.request('products.php'),
                2
            );
            
            if (Array.isArray(products) && products.length > 0) {
                // Armazena no cache
                this.productsCache = products;
                return products;
            }
            return fallbackProducts;
        } catch (error) {
            console.error('Erro ao obter produtos, usando fallback:', error);
            return fallbackProducts;
        }
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
        try {
            const result = await this.request('products.php', 'POST', product);
            // Limpa o cache após adicionar um produto
            this.clearProductsCache();
            return result;
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza um produto existente
     * @param {Object} product - Dados do produto
     * @returns {Promise<Object>} Produto atualizado
     */
    async updateProduct(product) {
        try {
            const result = await this.request('products.php', 'PUT', product);
            // Limpa o cache após atualizar um produto
            this.clearProductsCache();
            return result;
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            throw error;
        }
    }
    
    /**
     * Remove um produto
     * @param {number} id - ID do produto
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteProduct(id) {
        try {
            const result = await this.request('products.php', 'DELETE', null, { id });
            // Limpa o cache após remover um produto
            this.clearProductsCache();
            return result;
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            throw error;
        }
    }
    
    /**
     * Limpa o cache de produtos
     */
    clearProductsCache() {
        console.log('Limpando cache de produtos');
        this.productsCache = null;
    }
    
    /**
     * Limpa todos os caches
     */
    clearAllCaches() {
        this.clearCategoriesCache();
        this.clearProductsCache();
    }
    
    // Métodos específicos para categorias
    
    /**
     * Obtém todas as categorias
     * @param {boolean} useCache - Se deve usar cache quando disponível
     * @returns {Promise<Array>} Lista de categorias
     */
    async getAllCategories(useCache = true) {
        // Verifica se temos categorias em cache e se devemos usá-las
        if (useCache && this.categoriesCache) {
            console.log('Usando categorias em cache');
            return this.categoriesCache;
        }
        
        try {
            // Adiciona parâmetro de timestamp para evitar cache do navegador
            const timestamp = Date.now();
            
            const apiCategories = await this.requestWithRetry(
                () => this.request('categories.php', 'GET', null, { timestamp }),
                3 // 3 tentativas
            );
            
            if (Array.isArray(apiCategories) && apiCategories.length > 0) {
                // Armazena no cache da instância
                this.categoriesCache = apiCategories;
                
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
            
            if (!category || !category.name) {
                console.error('Tentativa de adicionar categoria sem nome');
                throw new Error('O nome da categoria é obrigatório');
            }
            
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
            try {
                const result = await this.requestWithRetry(
                    () => this.request('categories.php', 'POST', categoryData, {}, headers),
                    3 // 3 tentativas
                );
                
                console.log('Categoria adicionada com sucesso:', result);
                
                // Limpa o cache após adicionar uma categoria
                this.clearCategoriesCache();
                
                // Dispara evento de atualização
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('categories-updated', {
                        detail: { action: 'add', category: result }
                    }));
                }, 100);
                
                return result;
            } catch (requestError) {
                console.error('Erro na requisição ao adicionar categoria:', requestError);
                throw new Error(`Erro ao comunicar com servidor: ${requestError.message}`);
            }
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
            
            const result = await this.requestWithRetry(
                () => this.request('categories.php', 'PUT', {...category, timestamp}, {}, headers),
                3 // 3 tentativas
            );
            
            // Limpa o cache após atualizar uma categoria
            this.clearCategoriesCache();
            
            // Dispara evento de atualização
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('categories-updated', {
                    detail: { action: 'update', category: result }
                }));
            }, 100);
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
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
            
            const result = await this.requestWithRetry(
                () => this.request('categories.php', 'DELETE', null, params, headers),
                3 // 3 tentativas
            );
            
            console.log(`Categoria excluída com sucesso: ${id}`, result);
            
            // Limpa o cache após excluir uma categoria
            this.clearCategoriesCache();
            
            // Dispara evento de atualização
            setTimeout(() => {
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
        if (!file || !(file instanceof File)) {
            console.error('Upload inválido: o arquivo não é válido', file);
            throw new Error('Arquivo de imagem inválido');
        }
        
        const formData = new FormData();
        formData.append('image', file);
        
        // Determinar a URL de upload correta
        let uploadUrl;
        const isProduction = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('127.0.0.1');
        
        if (isProduction) {
            // Em produção, usar caminho relativo
            uploadUrl = `${window.location.origin}/upload.php`;
        } else {
            // Em desenvolvimento, usar o caminho do servidor
            uploadUrl = `${window.location.origin}/${this.baseUrl}/upload.php`;
        }
        
        console.log(`Tentando fazer upload para: ${uploadUrl}`);
        
        // Usar o mecanismo de retry para uploads
        return this.requestWithRetry(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.warn(`Tempo limite excedido para upload, abortando...`);
                controller.abort();
            }, 60000); // 60 segundos para upload, que pode demorar mais
            
            try {
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Erro no upload (${response.status}): ${errorText}`);
                    throw new Error(`Erro ao fazer upload da imagem: ${response.status}`);
                }
                
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    const result = await response.json();
                    console.log('Upload realizado com sucesso:', result);
                    return result.imagePath;
                } else {
                    const text = await response.text();
                    console.log('Resposta em texto do upload:', text);
                    
                    // Tenta extrair o caminho da imagem da resposta
                    try {
                        const result = JSON.parse(text);
                        return result.imagePath;
                    } catch (jsonError) {
                        throw new Error('Resposta do servidor não contém dados válidos');
                    }
                }
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Erro no upload da imagem:', error);
                throw error;
            }
        }, 3); // Tenta até 3 vezes
    }
    
    /**
     * Realiza uma requisição com até X tentativas em caso de erro
     * @param {Function} requestFn - Função que realiza a requisição
     * @param {number} maxRetries - Número máximo de tentativas
     * @param {number} delay - Delay entre tentativas em ms
     * @returns {Promise<any>} - Resultado da requisição
     */
    async requestWithRetry(requestFn, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                // Se for o último retry, não precisa esperar
                if (attempt < maxRetries) {
                    console.log(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    // Aumenta o delay a cada tentativa (backoff exponencial)
                    delay *= 1.5;
                }
            }
        }
        
        console.error(`Todas as ${maxRetries} tentativas falharam`);
        throw lastError;
    }
    
    /**
     * Limpa o cache de categorias
     */
    clearCategoriesCache() {
        console.log('Limpando cache de categorias');
        this.categoriesCache = null;
    }
}

// Cria uma instância global da API
const apiService = new ApiService();
// Também define api como global para compatibilidade
window.api = apiService;
window.apiService = apiService; 