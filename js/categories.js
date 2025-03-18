/**
 * Sistema de Gerenciamento de Categorias e Subcategorias
 * Versão 4.0
 */

// Inicializa o serviço de API se ainda não foi inicializado
if (typeof window.api === 'undefined' && typeof ApiService !== 'undefined') {
    window.api = new ApiService('server');
}

class CategoryManager {
    constructor() {
        this.categories = [];
        this.loadCategories();
    }

    /**
     * Carrega as categorias da API
     */
    async loadCategories() {
        try {
            // Carrega as categorias da API
            const apiResponse = await window.api.getAllCategories();
            
            // Garante que as categorias sejam tratadas como array
            this.categories = Array.isArray(apiResponse) ? apiResponse : Object.values(apiResponse || {});
            
            console.log('Categorias carregadas da API:', this.categories.length);
        } catch (error) {
            console.error('Erro ao carregar categorias da API:', error);
            this.initDefaultCategories();
        }
    }

    /**
     * Inicializa categorias padrão
     */
    initDefaultCategories() {
        this.categories = [
            {
                id: 1,
                name: 'Bags e Mochilas',
                parentId: null
            },
            {
                id: 2,
                name: 'Equipamentos de Proteção',
                parentId: null
            },
            {
                id: 3,
                name: 'Acessórios',
                parentId: null
            }
        ];
        console.log('Categorias padrão inicializadas:', this.categories.length);
    }

    /**
     * Obtém todas as categorias
     * @returns {Array} Lista de categorias
     */
    getAllCategories() {
        return this.categories;
    }

    /**
     * Obtém uma categoria pelo ID
     * @param {string|number} id - ID da categoria
     * @returns {Object|null} Categoria encontrada ou null
     */
    getCategoryById(id) {
        // Trata IDs numéricos e strings
        if (typeof id === 'string' && id.startsWith('cat') && !isNaN(id.replace('cat', ''))) {
            // Para IDs no formato 'catX'
            return this.categories.find(cat => cat.id === id) ||
                   this.categories.find(cat => cat.id === parseInt(id.replace('cat', ''))) ||
                   null;
        } else if (!isNaN(id)) {
            // Para IDs numéricos
            const numId = parseInt(id);
            return this.categories.find(cat => cat.id === numId) ||
                   this.categories.find(cat => cat.id === 'cat' + numId) ||
                   null;
        }
        // Para outros formatos de ID
        return this.categories.find(cat => cat.id === id) || null;
    }

    /**
     * Obtém as categorias principais (sem categoria pai)
     * @returns {Array} Lista de categorias principais
     */
    getMainCategories() {
        // Garante que this.categories seja um array
        const categoriesArray = Array.isArray(this.categories) ? this.categories : Object.values(this.categories || {});
        
        return categoriesArray.filter(cat => 
            !cat.parentId || cat.parentId === 'null' || cat.parentId === '0' || cat.parentId === 0
        );
    }

    /**
     * Obtém subcategorias de uma categoria
     * @param {string|number} parentId - ID da categoria pai
     * @returns {Array} Lista de subcategorias
     */
    getSubcategories(parentId) {
        if (!parentId) return [];
        
        // Normaliza o ID para comparação
        const normalizedId = this.normalizeId(parentId);
        
        // Garante que this.categories seja um array
        const categoriesArray = Array.isArray(this.categories) ? this.categories : Object.values(this.categories || {});
        
        // Filtra as subcategorias
        return categoriesArray.filter(cat => {
            if (!cat.parentId) return false;
            
            // Normaliza o parentId da categoria atual
            const catParentId = this.normalizeId(cat.parentId);
            
            return catParentId === normalizedId;
        });
    }

    /**
     * Normaliza um ID para comparação (lida com 'catX' e X formatos)
     * @param {string|number} id - ID para normalizar
     * @returns {string} ID normalizado
     */
    normalizeId(id) {
        if (typeof id === 'string' && id.startsWith('cat')) {
            return id;
        } else if (id) {
            return 'cat' + id;
        }
        return '';
    }

    /**
     * Verifica se uma categoria tem subcategorias
     * @param {string|number} categoryId - ID da categoria
     * @returns {boolean} Tem subcategorias
     */
    hasSubcategories(categoryId) {
        if (!categoryId) return false;
        
        // Garante que this.categories seja um array
        const categoriesArray = Array.isArray(this.categories) ? this.categories : Object.values(this.categories || {});
        
        // Normaliza o ID para comparação
        const normalizedId = this.normalizeId(categoryId);
        
        // Verifica se existe alguma categoria com este parentId
        return categoriesArray.some(cat => {
            if (!cat.parentId) return false;
            
            // Normaliza o parentId da categoria atual
            const catParentId = this.normalizeId(cat.parentId);
            
            return catParentId === normalizedId;
        });
    }

    /**
     * Adiciona uma nova categoria
     * @param {string} name - Nome da categoria
     * @param {string|number|null} parentId - ID da categoria pai (opcional)
     * @returns {Promise<Object>} Categoria adicionada
     */
    async addCategory(name, parentId = null) {
        if (!name) {
            console.error('Nome da categoria não fornecido');
            return null;
        }
        
        try {
            // Cria a nova categoria
            const newCategory = {
                name,
                parentId
            };
            
            // Adiciona a categoria via API
            const addedCategory = await window.api.addCategory(newCategory);
            
            // Atualiza a lista local
            await this.loadCategories();
            
            return addedCategory;
        } catch (error) {
            console.error('Erro ao adicionar categoria:', error);
            throw error;
        }
    }

    /**
     * Atualiza uma categoria existente
     * @param {string|number} id - ID da categoria
     * @param {string} name - Novo nome da categoria
     * @returns {Promise<Object>} Categoria atualizada
     */
    async updateCategory(id, name) {
        if (!id || !name) {
            console.error('ID ou nome da categoria não fornecido');
            return null;
        }
        
        try {
            // Obtém a categoria existente
            const category = this.getCategoryById(id);
            if (!category) {
                console.error(`Categoria com ID ${id} não encontrada`);
                return null;
            }
            
            // Atualiza o nome
            category.name = name;
            
            // Atualiza a categoria via API
            const updatedCategory = await window.api.updateCategory(category);
            
            // Atualiza a lista local
            await this.loadCategories();
            
            return updatedCategory;
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            throw error;
        }
    }

    /**
     * Remove uma categoria
     * @param {string|number} id - ID da categoria
     * @param {boolean} updateSubcategories - Se deve atualizar subcategorias
     * @param {string|number|null} newParentId - Novo ID de categoria pai para subcategorias
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteCategory(id, updateSubcategories = true, newParentId = null) {
        if (!id) {
            console.error('ID da categoria não fornecido');
            return null;
        }
        
        try {
            // Remove a categoria via API
            const response = await window.api.deleteCategory(id, updateSubcategories, newParentId);
            
            // Atualiza a lista local
            await this.loadCategories();
            
            // Atualiza os caminhos de categoria dos produtos
            if (typeof ProductManager !== 'undefined' && window.productManager) {
                if (typeof window.productManager.updateProductCategoryPaths === 'function') {
                    window.productManager.updateProductCategoryPaths();
                }
            }
            
            return response;
        } catch (error) {
            console.error('Erro ao remover categoria:', error);
            throw error;
        }
    }

    /**
     * Obtém a hierarquia completa de categorias
     * @returns {Array} Hierarquia de categorias
     */
    getCategoryHierarchy() {
        try {
            // Obtém categorias principais
            const mainCategories = this.getMainCategories();
            
            // Constrói a hierarquia para cada categoria principal
            const hierarchy = mainCategories.map(category => {
                // Cria uma cópia da categoria para evitar modificar o original
                const categoryCopy = { ...category };
                
                // Adiciona subcategorias se houver
                if (this.hasSubcategories(category.id)) {
                    categoryCopy.subcategories = this.buildSubcategoryTree(category.id);
                }
                
                return categoryCopy;
            });
            
            return hierarchy;
        } catch (error) {
            console.error('Erro ao construir hierarquia de categorias:', error);
            return [];
        }
    }

    /**
     * Constrói a árvore de subcategorias
     * @param {string|number} categoryId - ID da categoria
     * @returns {Array} Árvore de subcategorias
     */
    buildSubcategoryTree(categoryId) {
        // Obtém subcategorias diretas
        const subcategories = this.getSubcategories(categoryId);
        
        // Para cada subcategoria, verifica se tem subcategorias próprias
        return subcategories.map(subcat => {
            // Cria uma cópia da subcategoria para evitar modificar o original
            const subcatCopy = { ...subcat };
            
            // Adiciona subcategorias se houver
            if (this.hasSubcategories(subcat.id)) {
                subcatCopy.subcategories = this.buildSubcategoryTree(subcat.id);
            }
            
            return subcatCopy;
        });
    }

    /**
     * Obtém uma lista plana de categorias com informações de nível
     * @returns {Array} Lista plana de categorias
     */
    getFlatCategories() {
        const result = [];
        
        const addSubcategories = (parentId, level, parentPath) => {
            // Obtém subcategorias do ID pai
            const subcategories = this.getSubcategories(parentId);
            
            // Adiciona cada subcategoria ao resultado
            subcategories.forEach(category => {
                // Obtém o nome da categoria
                const categoryName = category.name || 'Categoria sem nome';
                
                // Cria o caminho completo da categoria
                const path = parentPath ? `${parentPath} > ${categoryName}` : categoryName;
                
                // Adiciona a categoria ao resultado
                result.push({
                    id: category.id,
                    name: categoryName,
                    level,
                    path,
                    parentId: category.parentId
                });
                
                // Processa subcategorias recursivamente
                addSubcategories(category.id, level + 1, path);
            });
        };
        
        // Começa com as categorias principais (nível 0, sem caminho)
        const mainCategories = this.getMainCategories();
        
        // Adiciona as categorias principais ao resultado
        mainCategories.forEach(category => {
            result.push({
                id: category.id,
                name: category.name || 'Categoria sem nome',
                level: 0,
                path: category.name || 'Categoria sem nome',
                parentId: null
            });
            
            // Processa subcategorias
            addSubcategories(category.id, 1, category.name);
        });
        
        return result;
    }

    /**
     * Obtém o caminho completo de uma categoria
     * @param {string|number} categoryId - ID da categoria
     * @returns {string} Caminho completo da categoria
     */
    getCategoryPath(categoryId) {
        const category = this.getCategoryById(categoryId);
        if (!category) return '';
        
        let path = category.name;
        let currentCategoryId = category.parentId;
        
        // Construir o caminho recursivamente
        while (currentCategoryId) {
            const parentCategory = this.getCategoryById(currentCategoryId);
            if (!parentCategory) break;
            
            path = `${parentCategory.name} > ${path}`;
            currentCategoryId = parentCategory.parentId;
        }
        
        return path;
    }

    /**
     * Atualiza os caminhos de categoria nos produtos
     */
    updateProductCategoryPaths() {
        if (typeof ProductManager !== 'undefined' && window.productManager) {
            const products = window.productManager.getAllProducts();
            
            products.forEach(product => {
                if (product.categoryId) {
                    product.categoryPath = this.getCategoryPath(product.categoryId);
                }
            });
        }
    }
}

// Cria a instância do gerenciador de categorias
const categoryManager = new CategoryManager();

// Exporta a instância para o escopo global
window.categoryManager = categoryManager;

// Configura a inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('CategoryManager inicializado com sucesso');
}); 