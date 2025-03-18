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
        this.api = new ApiService();
        
        // Adicionar listeners para eventos de atualização de categorias
        window.addEventListener('categories-updated', this.handleCategoriesUpdated.bind(this));
    }
    
    /**
     * Manipula evento de atualização de categorias
     * @param {CustomEvent} event - Evento com detalhes da atualização
     */
    handleCategoriesUpdated(event) {
        const { action, category, categoryId } = event.detail;
        
        // Recarrega as categorias após qualquer alteração
        this.loadCategories().then(() => {
            // Após recarregar, dispara evento para componentes atualizarem UI
            const refreshEvent = new CustomEvent('categories-refreshed', {
                detail: { action, category, categoryId }
            });
            window.dispatchEvent(refreshEvent);
        });
    }
    
    /**
     * Carrega as categorias da API
     * @returns {Promise<Array>} Lista de categorias
     */
    async loadCategories() {
        try {
            console.log('Iniciando carregamento das categorias...');
            const categories = await this.api.getAllCategories();
            
            console.log('Categorias recebidas da API:', categories);
            
            if (Array.isArray(categories)) {
                this.categories = categories;
                
                // Notificar que as categorias foram carregadas
                window.dispatchEvent(new CustomEvent('categories-loaded', {
                    detail: { categories: this.categories }
                }));
                
                console.log(`${this.categories.length} categorias carregadas com sucesso`);
                return this.categories;
            } else {
                console.error('Categorias recebidas da API não são um array válido:', categories);
                this.categories = [];
                return [];
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            this.categories = [];
            return [];
        }
    }
    
    /**
     * Adiciona uma nova categoria
     * @param {Object|string} categoryOrName - Objeto da categoria ou nome da categoria
     * @param {string|null} parentId - ID da categoria pai (usado apenas se o primeiro parâmetro for string)
     * @returns {Promise<Object>} Categoria adicionada
     */
    async addCategory(categoryOrName, parentId = null) {
        try {
            let categoryData;
            
            // Verifica se o primeiro parâmetro é um objeto ou uma string
            if (typeof categoryOrName === 'object' && categoryOrName !== null) {
                // É um objeto, usa diretamente
                categoryData = categoryOrName;
            } else {
                // É uma string (nome da categoria), cria o objeto
                categoryData = {
                    name: categoryOrName,
                    parentId: parentId
                };
            }
            
            // Garante que o nome está presente e não está vazio
            if (!categoryData.name || typeof categoryData.name !== 'string' || categoryData.name.trim() === '') {
                throw new Error('Nome da categoria não pode estar vazio');
            }
            
            // Chama a API para adicionar a categoria
            const newCategory = await this.api.addCategory(categoryData);
            
            // A atualização automática será feita pelo evento 'categories-updated'
            return newCategory;
        } catch (error) {
            console.error('Erro ao adicionar categoria:', error);
            throw error;
        }
    }
    
    /**
     * Atualiza uma categoria existente
     * @param {string} id - ID da categoria
     * @param {string} name - Novo nome da categoria
     * @param {string|null} parentId - Novo ID da categoria pai
     * @returns {Promise<Object>} Categoria atualizada
     */
    async updateCategory(id, name, parentId = null) {
        try {
            const updatedCategory = await this.api.updateCategory({ id, name, parentId });
            
            // A atualização automática será feita pelo evento 'categories-updated'
            return updatedCategory;
        } catch (error) {
            console.error('Erro ao atualizar categoria:', error);
            throw error;
        }
    }
    
    /**
     * Remove uma categoria
     * @param {string} id - ID da categoria
     * @param {boolean} updateSubcategories - Se deve atualizar subcategorias
     * @param {string|null} newParentId - Novo ID de categoria pai para subcategorias
     * @returns {Promise<Object>} Resposta da API
     */
    async deleteCategory(id, updateSubcategories = false, newParentId = null) {
        try {
            const result = await this.api.deleteCategory(id, updateSubcategories, newParentId);
            
            // A atualização automática será feita pelo evento 'categories-updated'
            return result;
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            throw error;
        }
    }

    /**
     * Obtém todas as categorias
     * @returns {Array} Lista de categorias
     */
    getAllCategories() {
        // Garante que o retorno seja sempre um array
        return Array.isArray(this.categories) ? this.categories : [];
    }

    /**
     * Obtém uma categoria pelo ID
     * @param {string|number} id - ID da categoria
     * @returns {Object|null} Categoria encontrada ou null
     */
    getCategoryById(id) {
        // Garante que this.categories seja um array antes de usar find
        if (!Array.isArray(this.categories)) {
            console.warn('this.categories não é um array em getCategoryById');
            return null;
        }
        
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
        // Garante que this.categories seja um array antes de usar filter
        if (!Array.isArray(this.categories)) {
            console.warn('this.categories não é um array em getMainCategories');
            return [];
        }
        
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
        // Garante que this.categories seja um array antes de usar filter
        if (!Array.isArray(this.categories)) {
            console.warn('this.categories não é um array em getSubcategories');
            return [];
        }
        
        // Normaliza os tipos de parentId para comparação
        if (parentId === undefined || parentId === null) {
            return [];
        }
        
        // Converte para string para fazer comparações consistentes
        const parentIdStr = String(parentId);
        
        return this.categories.filter(cat => {
            if (!cat.parentId) return false;
            
            // Converte o parentId da categoria para string também
            const catParentIdStr = String(cat.parentId);
            
            return catParentIdStr === parentIdStr;
        });
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
     * Obtém a hierarquia de categorias para exibição
     * @returns {Array} Hierarquia de categorias
     */
    getCategoryHierarchy() {
        try {
            console.log('Método getCategoryHierarchy chamado. Total de categorias:', Array.isArray(this.categories) ? this.categories.length : 0);
            
            // Garantir que temos categorias para trabalhar
            if (!Array.isArray(this.categories) || this.categories.length === 0) {
                console.log('Nenhuma categoria válida encontrada, tentando recarregar...');
                // Força um recarregamento imediato
                this.loadCategories();
                return []; // Retorna vazio por enquanto
            }
            
            const mainCategories = this.getMainCategories();
            console.log('Categorias principais encontradas:', mainCategories.length);
            
            // Se não houver categorias principais, retorna array vazio
            if (!Array.isArray(mainCategories) || mainCategories.length === 0) {
                return [];
            }
            
            const hierarchy = mainCategories.map(category => ({
                ...category,
                subcategories: this.buildSubcategoryTree(category.id)
            }));
            
            console.log('Hierarquia de categorias construída com sucesso');
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
        if (categoryId === undefined || categoryId === null) {
            return [];
        }
        
        const subcategories = this.getSubcategories(categoryId);
        
        if (!Array.isArray(subcategories) || subcategories.length === 0) {
            return [];
        }
        
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
        
        // Verificar se this.categories é um array válido
        if (!Array.isArray(this.categories) || this.categories.length === 0) {
            console.warn('Tentativa de obter categorias planas sem categorias válidas');
            return result;
        }
        
        const addSubcategories = (parentId, level, parentPath) => {
            // Garantir que obtemos um array válido de subcategorias
            const subcategories = this.getSubcategories(parentId);
            
            if (!Array.isArray(subcategories)) {
                return;
            }
            
            subcategories.forEach(category => {
                if (!category || !category.name) {
                    return; // Pula categorias inválidas
                }
                
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
        
        if (Array.isArray(mainCategories)) {
            mainCategories.forEach(category => {
                if (!category || !category.name) {
                    return; // Pula categorias inválidas
                }
                
                result.push({
                    ...category,
                    level: 0,
                    indent: '',
                    path: category.name
                });
                
                // Adiciona subcategorias recursivamente
                addSubcategories(category.id, 1, category.name);
            });
        }
        
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

/**
 * Atualiza a interface de categorias
 */
function refreshCategoryUI() {
    // Atualiza a lista de categorias na tabela
    renderCategoryTable();
    
    // Atualiza os selects de categorias
    updateCategorySelects();
    
    console.log('Interface de categorias atualizada');
}

// Configurar listener para depuração
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando depuração de categorias');
    
    // Verificar se a API está inicializada corretamente
    if (typeof ApiService === 'undefined') {
        console.error('ERRO: ApiService não está definido!');
    } else {
        console.log('ApiService encontrado');
    }
    
    // Verificar se o CategoryManager está inicializado
    if (typeof window.categoryManager === 'undefined') {
        console.error('ERRO: window.categoryManager não está definido!');
        
        // Tentar criar uma nova instância
        console.log('Tentando criar uma nova instância de CategoryManager...');
        window.categoryManager = new CategoryManager();
    } else {
        console.log('CategoryManager encontrado');
    }
    
    // Verificar se existem categorias
    console.log('Status atual do CategoryManager:', {
        categoriesLength: window.categoryManager.categories?.length,
        categories: window.categoryManager.categories
    });
    
    // Tentar recarregar as categorias
    try {
        console.log('Tentando carregar categorias forçadamente...');
        const categories = await window.categoryManager.loadCategories();
        console.log('Resultado do carregamento forçado:', {
            success: Array.isArray(categories),
            categoriesLength: categories?.length,
            categories: categories
        });
        
        // Tentar obter a hierarquia
        const hierarchy = window.categoryManager.getCategoryHierarchy();
        console.log('Hierarquia de categorias:', hierarchy);
        
        // Tentar renderizar manualmente as categorias se estamos na página inicial
        const categoryTree = document.getElementById('category-tree');
        if (categoryTree) {
            console.log('Elemento category-tree encontrado, tentando renderizar categorias...');
            
            // Limpar o container
            categoryTree.innerHTML = '';
            
            if (Array.isArray(hierarchy) && hierarchy.length > 0) {
                // Tentar renderizar a hierarquia
                try {
                    // Criar uma simples lista de categorias
                    const list = document.createElement('ul');
                    list.className = 'category-list';
                    
                    hierarchy.forEach(category => {
                        const item = document.createElement('li');
                        item.className = 'category-item';
                        item.innerHTML = `<a href="#" data-id="${category.id}" class="category-link">${category.name}</a>`;
                        
                        if (category.subcategories && category.subcategories.length > 0) {
                            item.classList.add('has-subcategories');
                            
                            const sublist = document.createElement('ul');
                            sublist.className = 'subcategories';
                            
                            category.subcategories.forEach(subcat => {
                                const subitem = document.createElement('li');
                                subitem.innerHTML = `<a href="#" data-id="${subcat.id}" class="category-link">${subcat.name}</a>`;
                                sublist.appendChild(subitem);
                            });
                            
                            item.appendChild(sublist);
                        }
                        
                        list.appendChild(item);
                    });
                    
                    categoryTree.appendChild(list);
                    console.log('Categorias renderizadas manualmente com sucesso');
                } catch (renderError) {
                    console.error('Erro ao renderizar categorias manualmente:', renderError);
                }
            } else {
                categoryTree.innerHTML = '<p class="empty-message">Nenhuma categoria encontrada.</p>';
                console.warn('Nenhuma categoria para renderizar');
            }
        } else {
            console.log('Elemento category-tree não encontrado na página');
        }
    } catch (error) {
        console.error('Erro durante depuração de categorias:', error);
    }
}); 