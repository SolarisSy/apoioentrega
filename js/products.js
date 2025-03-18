/**
 * Sistema de Gerenciamento de Produtos
 * Versão 3.0
 */

class ProductManager {
    constructor() {
        // Usar a instância global de ApiService
        if (!window.api) {
            console.log('Inicializando ApiService a partir de ProductManager');
            window.api = new ApiService();
        }
        
        this.api = window.api;
        this.products = [];
        
        // Adiciona listener para evento de atualização de categorias
        window.addEventListener('categories-refreshed', this.handleCategoriesRefreshed.bind(this));
    }
    
    /**
     * Manipula evento de atualização de categorias
     */
    handleCategoriesRefreshed() {
        // Quando as categorias são atualizadas, atualiza os caminhos de categoria dos produtos
        this.updateProductCategoryPaths();
    }
    
    /**
     * Carrega os produtos da API
     * @param {boolean} useCache - Se deve usar cache quando disponível
     * @returns {Promise<Array>} Lista de produtos
     */
    async loadProducts(useCache = true) {
        try {
            console.log('Iniciando carregamento de produtos...');
            const products = await this.api.getAllProducts(useCache);
            
            if (Array.isArray(products)) {
                this.products = products;
                
                // Atualiza os caminhos de categoria
                this.updateProductCategoryPaths();
                
                console.log(`${this.products.length} produtos carregados com sucesso`);
                return this.products;
            } else {
                console.error('Lista de produtos inválida:', products);
                return [];
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            return [];
        }
    }
    
    /**
     * Atualiza os caminhos de categoria dos produtos
     */
    updateProductCategoryPaths() {
        // Verifica se temos acesso ao categoryManager
        if (!window.categoryManager) {
            console.warn('CategoryManager não disponível para atualizar caminhos de categoria');
            return;
        }
        
        // Para cada produto, adiciona o caminho da categoria
        this.products.forEach(product => {
            if (product.categoryId) {
                product.categoryPath = window.categoryManager.getCategoryPathById(product.categoryId);
            } else {
                product.categoryPath = 'Sem categoria';
            }
        });
    }

    /**
     * Obtém todos os produtos
     * @returns {Array} Lista de produtos
     */
    getAllProducts() {
        return this.products;
    }

    /**
     * Obtém um produto pelo ID
     * @param {number} id - ID do produto
     * @returns {Object|null} Produto encontrado ou null
     */
    getProductById(id) {
        return this.products.find(product => product.id === id) || null;
    }

    /**
     * Obtém produtos por categoria
     * @param {string|number} categoryId - ID da categoria
     * @param {boolean} includeSubcategories - Se deve incluir produtos de subcategorias
     * @returns {Array} Lista de produtos da categoria
     */
    async getProductsByCategory(categoryId, includeSubcategories = true) {
        if (!categoryId || categoryId === 'todos') {
            return this.products;
        }
        
        try {
            if (includeSubcategories && typeof CategoryManager !== 'undefined' && window.categoryManager) {
                // Obtém a categoria e suas subcategorias
                const categoryManager = window.categoryManager;
                const subcategoryIds = this.getAllSubcategoryIds(categoryManager, categoryId);
                
                // Inclui a categoria principal e todas as subcategorias na busca
                const allCategoryIds = [categoryId, ...subcategoryIds];
                
                // Filtragem no cliente para subcategorias
                return this.products.filter(product => {
                    return allCategoryIds.some(catId => 
                        product.categoryId == catId || // Comparação não estrita para lidar com tipos diferentes
                        (typeof product.categoryId === 'string' && product.categoryId === String(catId)) ||
                        (typeof product.categoryId === 'number' && product.categoryId === Number(catId))
                    );
                });
            } else {
                // Busca produtos apenas da categoria específica usando a API
                return await window.api.getProductsByCategory(categoryId);
            }
        } catch (error) {
            console.error('Erro ao obter produtos por categoria:', error);
            
            // Filtragem básica como fallback
            return this.products.filter(product => 
                product.categoryId == categoryId // Comparação não estrita para lidar com tipos diferentes
            );
        }
    }
    
    /**
     * Obtém todos os IDs de subcategorias recursivamente
     * @param {Object} categoryManager - Instância do CategoryManager
     * @param {string|number} categoryId - ID da categoria pai
     * @returns {Array} Lista de IDs de subcategorias
     */
    getAllSubcategoryIds(categoryManager, categoryId) {
        const subcategoryIds = [];
        
        try {
            // Obtém subcategorias diretas
            const subcategories = categoryManager.getSubcategories(categoryId);
            
            // Adiciona IDs das subcategorias
            subcategories.forEach(subcat => {
                subcategoryIds.push(subcat.id);
                
                // Adiciona IDs das subcategorias recursivamente
                const nestedIds = this.getAllSubcategoryIds(categoryManager, subcat.id);
                if (nestedIds.length > 0) {
                    subcategoryIds.push(...nestedIds);
                }
            });
        } catch (error) {
            console.error(`Erro ao buscar subcategorias para ${categoryId}:`, error);
        }
        
        return subcategoryIds;
    }

    /**
     * Busca produtos por termo de pesquisa
     * @param {string} searchTerm - Termo de pesquisa
     * @returns {Promise<Array>} Lista de produtos encontrados
     */
    async searchProducts(searchTerm) {
        if (!searchTerm) {
            return this.products;
        }
        
        try {
            // Usa a API para fazer a busca
            return await window.api.searchProducts(searchTerm);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            
            // Fallback para busca local caso a API falhe
            const term = searchTerm.toLowerCase();
            return this.products.filter(product => 
                product.name.toLowerCase().includes(term) || 
                (product.description && product.description.toLowerCase().includes(term))
            );
        }
    }

    /**
     * Obtém produtos em destaque
     * @returns {Array} Lista de produtos em destaque
     */
    getFeaturedProducts() {
        return this.products.filter(product => product.featured);
    }

    /**
     * Obtém produtos em promoção
     * @returns {Array} Lista de produtos em promoção
     */
    getSaleProducts() {
        return this.products.filter(product => product.sale);
    }

    /**
     * Obtém o nome da categoria pelo ID
     * @param {string|number} id - ID da categoria
     * @returns {string} Nome da categoria ou 'Sem categoria'
     */
    getCategoryNameById(id) {
        if (!id) return 'Sem categoria';
        
        try {
            if (typeof CategoryManager !== 'undefined' && window.categoryManager) {
                const category = window.categoryManager.getCategoryById(id);
                return category ? category.name : 'Sem categoria';
            }
        } catch (error) {
            console.warn(`Erro ao obter nome da categoria ${id}:`, error);
        }
        
        return 'Sem categoria';
    }

    /**
     * Obtém o caminho da categoria pelo ID
     * @param {string|number} id - ID da categoria
     * @returns {string} Caminho da categoria ou 'Sem categoria'
     */
    getCategoryPathById(id) {
        if (!id) return 'Sem categoria';
        
        try {
            if (typeof CategoryManager !== 'undefined' && window.categoryManager) {
                const path = window.categoryManager.getCategoryPath(id);
                return path || 'Sem categoria';
            }
        } catch (error) {
            console.warn(`Erro ao obter caminho da categoria ${id}:`, error);
        }
        
        return 'Sem categoria';
    }

    /**
     * Formata o preço para exibição
     * @param {number} price - Preço a ser formatado
     * @returns {string} Preço formatado
     */
    formatPrice(price) {
        return price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }
    
    /**
     * Adiciona um novo produto
     * @param {Object} product - Produto a ser adicionado
     * @returns {Promise<Object>} Produto adicionado
     */
    async addProduct(product) {
        try {
            // Usa a API para adicionar o produto
            const newProduct = await window.api.addProduct(product);
            
            // Atualiza a lista local de produtos
            await this.loadProducts();
            
            return newProduct;
        } catch (error) {
            console.error('Erro ao adicionar produto:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza um produto existente
     * @param {Object} product - Produto a ser atualizado
     * @returns {Promise<Object>} Produto atualizado
     */
    async updateProduct(product) {
        try {
            // Usa a API para atualizar o produto
            const updatedProduct = await window.api.updateProduct(product);
            
            // Atualiza a lista local de produtos
            await this.loadProducts();
            
            return updatedProduct;
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
            // Usa a API para remover o produto
            const response = await window.api.deleteProduct(id);
            
            // Atualiza a lista local de produtos
            await this.loadProducts();
            
            return response;
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            throw error;
        }
    }
}

// Cria a instância do gerenciador de produtos
const productManager = new ProductManager();

// Exporta a instância para o escopo global
window.productManager = productManager;

// Configura a inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('ProductManager inicializado com sucesso');
}); 