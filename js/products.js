/**
 * Classe para gerenciar os produtos do e-commerce
 */

// Inicializa o serviço de API se ainda não foi inicializado
if (typeof window.api === 'undefined' && typeof ApiService !== 'undefined') {
    window.api = new ApiService('server');
}

class ProductManager {
    constructor() {
        this.products = [];
        this.loadProducts();
    }

    /**
     * Carrega os produtos da API
     */
    async loadProducts() {
        try {
            // Carrega os produtos da API
            const productsData = await window.api.getAllProducts();
            
            // Garante que this.products seja sempre um array
            this.products = Array.isArray(productsData) ? productsData : [];
            
            // Processa as imagens dos produtos
            this.products.forEach(product => {
                // Para URLs externas ou placeholders
                if (!product.imageUrl) {
                    product.imageUrl = product.image;
                }
                
                // Atualiza o caminho da categoria se o CategoryManager estiver disponível
                this.updateProductCategoryPath(product);
            });
            
            console.log(`Carregados ${this.products.length} produtos.`);
            return this.products;
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            this.products = [];
            return [];
        }
    }

    /**
     * Atualiza o caminho da categoria de um produto
     * @param {Object} product - Produto a ser atualizado
     */
    updateProductCategoryPath(product) {
        if (!product.categoryId) return;
        
        try {
            // Verifica se o CategoryManager está disponível
            if (typeof CategoryManager !== 'undefined' && window.categoryManager) {
                const categoryPath = window.categoryManager.getCategoryPath(product.categoryId);
                if (categoryPath) {
                    product.categoryPath = categoryPath;
                    console.log(`Caminho da categoria atualizado para o produto ${product.id}: ${categoryPath}`);
                }
            }
        } catch (error) {
            console.warn(`Erro ao atualizar caminho da categoria para o produto ${product.id}:`, error);
        }
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