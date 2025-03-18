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
            this.categories = await window.api.getAllCategories();
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
        return this.categories.filter(cat => 
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
        
        // Trata IDs numéricos e strings
        if (typeof parentId === 'string' && parentId.startsWith('cat') && !isNaN(parentId.replace('cat', ''))) {
            // Para IDs no formato 'catX'
            const numId = parseInt(parentId.replace('cat', ''));
            return this.categories.filter(cat => 
                cat.parentId === parentId || cat.parentId === numId
            );
        } else if (!isNaN(parentId)) {
            // Para IDs numéricos
            const numId = parseInt(parentId);
            return this.categories.filter(cat => 
                cat.parentId === numId || cat.parentId === 'cat' + numId
            );
        }
        
        // Para outros formatos de ID
        return this.categories.filter(cat => cat.parentId === parentId);
    }

    /**
     * Verifica se uma categoria possui subcategorias
     * @param {string|number} categoryId - ID da categoria
     * @returns {boolean} Verdadeiro se tiver subcategorias
     */
    hasSubcategories(categoryId) {
        if (!categoryId) return false;
        
        // Trata IDs numéricos e strings
        if (typeof categoryId === 'string' && categoryId.startsWith('cat') && !isNaN(categoryId.replace('cat', ''))) {
            // Para IDs no formato 'catX'
            const numId = parseInt(categoryId.replace('cat', ''));
            return this.categories.some(cat => 
                cat.parentId === categoryId || cat.parentId === numId
            );
        } else if (!isNaN(categoryId)) {
            // Para IDs numéricos
            const numId = parseInt(categoryId);
            return this.categories.some(cat => 
                cat.parentId === numId || cat.parentId === 'cat' + numId
            );
        }
        
        // Para outros formatos de ID
        return this.categories.some(cat => cat.parentId === categoryId);
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
     * Obtém a hierarquia de categorias para exibição
     * @returns {Array} Hierarquia de categorias
     */
    getCategoryHierarchy() {
        try {
            console.log('Método getCategoryHierarchy chamado. Total de categorias:', this.categories.length);
            
            // Aguarda pelo menos um breve momento para garantir que as categorias foram carregadas
            if (this.categories.length === 0) {
                console.log('Nenhuma categoria encontrada, tentando recarregar...');
                // Se não há categorias, força um recarregamento imediato
                this.loadCategories();
                return []; // Retorna vazio por enquanto
            }
            
            const mainCategories = this.getMainCategories();
            console.log('Categorias principais encontradas:', mainCategories.length);
            
            const hierarchy = mainCategories.map(category => ({
                ...category,
                subcategories: this.buildSubcategoryTree(category.id)
            }));
            
            console.log('Hierarquia de categorias construída:', hierarchy);
            return hierarchy;
        } catch (error) {
            console.error('Erro ao construir hierarquia de categorias:', error);
            return [];
        }
    }

    /**
     * Constrói a árvore de subcategorias recursivamente
     * @param {string|number} categoryId - ID da categoria pai
     * @returns {Array} Árvore de subcategorias
     */
    buildSubcategoryTree(categoryId) {
        const subcategories = this.getSubcategories(categoryId);
        
        return subcategories.map(category => ({
            ...category,
            subcategories: this.buildSubcategoryTree(category.id)
        }));
    }

    /**
     * Obtém lista de categorias em formato plano com indentação
     * @returns {Array} Lista de categorias com informações de nível
     */
    getFlatCategories() {
        const result = [];
        
        const addSubcategories = (parentId, level, parentPath) => {
            const subcategories = this.getSubcategories(parentId);
            
            subcategories.forEach(category => {
                const categoryPath = parentPath ? `${parentPath} > ${category.name}` : category.name;
                
                result.push({
                    ...category,
                    level,
                    indent: '—'.repeat(level),
                    path: categoryPath
                });
                
                // Adiciona subcategorias recursivamente
                addSubcategories(category.id, level + 1, categoryPath);
            });
        };
        
        // Adiciona categorias principais (nível 0)
        const mainCategories = this.getMainCategories();
        mainCategories.forEach(category => {
            result.push({
                ...category,
                level: 0,
                indent: '',
                path: category.name
            });
            
            // Adiciona subcategorias
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