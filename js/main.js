/**
 * Script principal para o e-commerce
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Não limpa mais o localStorage para preservar as alterações feitas no painel administrativo
    // localStorage.clear(); // Esta linha foi removida para manter as alterações feitas no painel administrativo
    
    // Inicializa os componentes da página
    initCarousel();
    
    // Espera o carregamento de categorias e produtos inicializar
    await Promise.all([
        new Promise(resolve => {
            // Verifica a cada 100ms se as categorias foram carregadas
            const checkCategoriesLoaded = () => {
                if (window.categoryManager && window.categoryManager.getAllCategories().length > 0) {
                    resolve();
                } else {
                    setTimeout(checkCategoriesLoaded, 100);
                }
            };
            checkCategoriesLoaded();
        }),
        loadProducts()
    ]);
    
    // Inicializa componentes que dependem de dados
    await initCategoryNavigation();
    initSearchBox();
    initCartModal();
    initProductModal();
    
    // Inicializa a grade de produtos
    initProductGrid();
    
    // Atualiza o contador do carrinho
    updateCartCount();

    // Inicializa o carrinho
    Cart.init();
});

/**
 * Inicializa a grade de produtos
 */
async function initProductGrid() {
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) {
        console.error('Elemento products-grid não encontrado no DOM');
        return;
    }
    
    // Aguarda o carregamento dos produtos
    await waitForProductsLoad();
    
    // Obtém todos os produtos
    const products = productManager.getAllProducts();
    console.log('Produtos para renderizar na grade:', products.length, products);
    
    // Limpa a grade de produtos
    productsGrid.innerHTML = '';
    
    // Verifica se há produtos
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
        return;
    }
    
    // Renderiza cada produto na grade
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

/**
 * Aguarda o carregamento dos produtos
 */
function waitForProductsLoad() {
    return new Promise(resolve => {
        const checkProducts = () => {
            if (productManager.getAllProducts().length > 0) {
                resolve();
            } else {
                setTimeout(checkProducts, 100);
            }
        };
        checkProducts();
    });
}

/**
 * Cria um card de produto
 * @param {Object} product - Dados do produto
 * @returns {HTMLElement} Elemento do card de produto
 */
function createProductCard(product) {
    if (!product) {
        console.error('Tentativa de criar card com produto nulo ou indefinido');
        return document.createElement('div'); // Retorna um div vazio em caso de produto inválido
    }

    try {
        // Verificações de segurança para evitar erros
        const safeProduct = {
            id: product.id || 0,
            name: product.name || 'Produto sem nome',
            description: product.description || 'Sem descrição',
            price: parseFloat(product.price || 0),
            salePrice: product.salePrice ? parseFloat(product.salePrice) : null,
            stock: parseInt(product.stock || 0),
            categoryId: product.categoryId || '',
            image: product.image || product.imageUrl || '',
            imageUrl: product.imageUrl || product.image || '',
            isNew: Boolean(product.isNew),
            sale: Boolean(product.sale),
            categoryPath: product.categoryPath || ''
        };

        // Verifica se o produto está esgotado
        const isOutOfStock = safeProduct.stock <= 0;
        
        // Obtém o caminho da categoria
        let categoryPath = safeProduct.categoryPath;
        if (!categoryPath && safeProduct.categoryId && typeof window.categoryManager !== 'undefined') {
            categoryPath = window.categoryManager.getCategoryPath(safeProduct.categoryId);
        }
        
        // Cria o elemento do produto
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        if (isOutOfStock) {
            productElement.classList.add('out-of-stock');
        }

        // Obtém a URL da imagem
        let imageUrl = safeProduct.imageUrl || safeProduct.image;
        if (!imageUrl || imageUrl === '') {
            imageUrl = `https://placehold.co/300x200/4a90e2/ffffff?text=${encodeURIComponent(safeProduct.name.substring(0, 20))}`;
        } else if (imageUrl.startsWith('img/')) {
            // Se a imagem começa com img/, adiciona o caminho relativo à raiz
            // Não é necessário buscar no localStorage
            if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
        }

        // Constrói o HTML do produto
        productElement.innerHTML = `
            <div class="product-image">
                <img src="${imageUrl}" alt="${safeProduct.name}" onerror="this.src='https://placehold.co/300x200/cccccc/666666?text=Imagem+indisponível'">
                ${safeProduct.isNew ? '<span class="product-badge new">Novo</span>' : ''}
                ${safeProduct.sale ? '<span class="product-badge sale">Promoção</span>' : ''}
                ${isOutOfStock ? '<span class="product-badge out-of-stock">Esgotado</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${safeProduct.name}</h3>
                ${categoryPath ? `<div class="product-category">${categoryPath}</div>` : ''}
                <div class="product-price">
                    ${safeProduct.sale && safeProduct.salePrice ? 
                      `<span class="original-price">R$ ${safeProduct.price.toFixed(2)}</span><span>R$ ${safeProduct.salePrice.toFixed(2)}</span>` : 
                      `<span>R$ ${safeProduct.price.toFixed(2)}</span>`}
                </div>
                <div class="product-stock">
                    ${isOutOfStock ? 'Produto esgotado' : `Em estoque: ${safeProduct.stock} unidades`}
                </div>
                <div class="product-actions">
                    <button class="view-btn" data-id="${safeProduct.id}">Ver Detalhes</button>
                    ${!isOutOfStock ? `<button class="add-to-cart-btn" data-id="${safeProduct.id}">Adicionar ao Carrinho</button>` : ''}
                </div>
            </div>
        `;

        // Adiciona eventos aos botões
        const viewBtn = productElement.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', () => {
                try {
                    openProductModal(safeProduct.id);
                } catch (error) {
                    console.error(`Erro ao abrir modal do produto ${safeProduct.id}:`, error);
                    showNotification('Erro ao abrir detalhes do produto', 'error');
                }
            });
        }
        
        const addToCartBtn = productElement.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                try {
                    addToCart(safeProduct.id);
                } catch (error) {
                    console.error(`Erro ao adicionar produto ${safeProduct.id} ao carrinho:`, error);
                    showNotification('Erro ao adicionar ao carrinho', 'error');
                }
            });
        }

        return productElement;
    } catch (error) {
        console.error('Erro ao criar card de produto:', error, product);
        const errorElement = document.createElement('div');
        errorElement.className = 'product-card error';
        errorElement.innerHTML = '<div class="error-message">Erro ao carregar produto</div>';
        return errorElement;
    }
}

/**
 * Inicializa o sistema de navegação de categorias
 */
async function initCategoryNavigation() {
    console.log('Inicializando sistema de navegação de categorias');
    
    // Verifica se o CategoryManager está disponível
    if (typeof CategoryManager === 'undefined' || !window.categoryManager) {
        console.error('CategoryManager não está definido ou não foi inicializado corretamente');
        return;
    }
    
    // Elementos do DOM
    const categoryTree = document.getElementById('category-tree');
    const breadcrumb = document.getElementById('category-breadcrumb');
    const categoryToggle = document.querySelector('.category-navigation-header .toggle-btn');
    const categoryNavigation = document.querySelector('.category-navigation');
    
    if (!categoryTree) {
        console.error('Elemento de navegação de categorias não encontrado');
        return;
    }
    
    // Aguarda o carregamento das categorias (com timeout para evitar espera infinita)
    let attempts = 0;
    const maxAttempts = 10;
    
    while (window.categoryManager.getAllCategories().length === 0 && attempts < maxAttempts) {
        console.log(`Aguardando carregamento de categorias... Tentativa ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
    }
    
    // Obtém a hierarquia de categorias
    const categoryHierarchy = window.categoryManager.getCategoryHierarchy();
    console.log('Hierarquia de categorias carregada:', categoryHierarchy);
    
    // Renderiza a árvore de categorias
    renderCategoryTree(categoryTree, categoryHierarchy);
    
    // Adiciona evento de toggle para dispositivos móveis
    if (categoryToggle && categoryNavigation) {
        categoryToggle.addEventListener('click', () => {
            categoryNavigation.classList.toggle('collapsed');
        });
    }
    
    // Verifica se há uma categoria na URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    
    if (categoryId) {
        // Seleciona a categoria da URL
        selectCategory(categoryId);
    } else {
        // Filtra todos os produtos por padrão
        filterProducts();
    }
    
    console.log('Sistema de navegação de categorias inicializado com sucesso');
}

/**
 * Renderiza a árvore de categorias
 * @param {HTMLElement} container - Elemento container
 * @param {Array} categories - Lista de categorias
 * @param {number} level - Nível de indentação
 */
function renderCategoryTree(container, categories, level = 0) {
    // Cria a lista de categorias
    const categoryList = document.createElement('ul');
    categoryList.className = level === 0 ? 'category-list' : 'subcategories';
    
    // Adiciona cada categoria
    categories.forEach(category => {
        // Cria o item da categoria
        const categoryItem = document.createElement('li');
        categoryItem.className = 'category-item';
        categoryItem.dataset.id = category.id;
        
        // Verifica se tem subcategorias
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        
        // Cria o link da categoria
        const categoryLink = document.createElement('a');
        categoryLink.href = `#produtos?category=${category.id}`;
        categoryLink.dataset.id = category.id;
        
        // Adiciona ícone de toggle se tiver subcategorias
        if (hasSubcategories) {
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.innerHTML = '<i class="fas fa-chevron-right"></i>';
            categoryLink.appendChild(toggleIcon);
        } else {
            // Espaçador para alinhar com as categorias que têm ícone
            const spacer = document.createElement('span');
            spacer.className = 'toggle-icon';
            spacer.style.visibility = 'hidden';
            categoryLink.appendChild(spacer);
        }
        
        // Adiciona o nome da categoria
        const categoryName = document.createElement('span');
        categoryName.className = 'category-name';
        categoryName.textContent = category.name;
        categoryLink.appendChild(categoryName);
        
        // Adiciona contador de produtos (será atualizado depois)
        const categoryCount = document.createElement('span');
        categoryCount.className = 'category-count';
        categoryCount.textContent = '0'; // Será atualizado depois
        categoryLink.appendChild(categoryCount);
        
        // Adiciona o link ao item
        categoryItem.appendChild(categoryLink);
        
        // Adiciona subcategorias se houver
        if (hasSubcategories) {
            renderCategoryTree(categoryItem, category.subcategories, level + 1);
            
            // Adiciona evento de toggle para expandir/colapsar
            categoryLink.addEventListener('click', (e) => {
                e.preventDefault();
                categoryItem.classList.toggle('expanded');
            });
        } else {
            // Adiciona evento de clique para filtrar produtos
            categoryLink.addEventListener('click', (e) => {
                e.preventDefault();
                selectCategory(category.id);
            });
        }
        
        // Adiciona o item à lista
        categoryList.appendChild(categoryItem);
    });
    
    // Adiciona a lista ao container
    container.appendChild(categoryList);
    
    // Atualiza os contadores de produtos
    updateCategoryCounts();
}

/**
 * Atualiza os contadores de produtos para cada categoria
 */
function updateCategoryCounts() {
    // Verifica se o ProductManager está disponível
    if (typeof productManager === 'undefined' || !window.productManager) {
        console.error('ProductManager não está definido ou não foi inicializado corretamente');
        return;
    }
    
    // Obtém todos os itens de categoria
    const categoryItems = document.querySelectorAll('.category-item');
    
    // Atualiza o contador de cada categoria
    categoryItems.forEach(item => {
        const categoryId = item.dataset.id;
        const countElement = item.querySelector('.category-count');
        
        if (categoryId && countElement) {
            // Obtém produtos da categoria (incluindo subcategorias)
            const products = productManager.getProductsByCategory(categoryId, true);
            countElement.textContent = products.length;
        }
    });
}

/**
 * Seleciona uma categoria e atualiza a interface
 * @param {string|number} categoryId - ID da categoria
 */
function selectCategory(categoryId) {
    console.log(`Selecionando categoria: ${categoryId}`);
    
    // Verifica se o CategoryManager está disponível
    if (typeof CategoryManager === 'undefined' || !window.categoryManager) {
        console.error('CategoryManager não está definido ou não foi inicializado corretamente');
        return;
    }
    
    // Remove a classe ativa de todas as categorias
    const allCategoryItems = document.querySelectorAll('.category-item');
    allCategoryItems.forEach(item => item.classList.remove('active'));
    
    // Adiciona a classe ativa à categoria selecionada
    const selectedItem = document.querySelector(`.category-item[data-id="${categoryId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        
        // Expande os pais da categoria selecionada
        let parent = selectedItem.parentElement;
        while (parent && parent.classList.contains('subcategories')) {
            const parentItem = parent.parentElement;
            if (parentItem && parentItem.classList.contains('category-item')) {
                parentItem.classList.add('expanded');
            }
            parent = parentItem ? parentItem.parentElement : null;
        }
    }
    
    // Atualiza o breadcrumb
    updateBreadcrumb(categoryId);
    
    // Filtra os produtos
    filterProducts(categoryId);
    
    // Atualiza a URL
    const url = new URL(window.location.href);
    url.searchParams.set('category', categoryId);
    window.history.replaceState({}, '', url);
}

/**
 * Atualiza o breadcrumb de navegação
 * @param {string|number} categoryId - ID da categoria
 */
function updateBreadcrumb(categoryId) {
    console.log(`Atualizando breadcrumb para categoria: ${categoryId}`);
    
    // Verifica se o CategoryManager está disponível
    if (typeof CategoryManager === 'undefined' || !window.categoryManager) {
        console.error('CategoryManager não está definido ou não foi inicializado corretamente');
        return;
    }
    
    const breadcrumb = document.getElementById('category-breadcrumb');
    if (!breadcrumb) {
        console.error('Elemento breadcrumb não encontrado');
        return;
    }
    
    // Limpa o breadcrumb, mantendo apenas o item "Início"
    while (breadcrumb.children.length > 1) {
        breadcrumb.removeChild(breadcrumb.lastChild);
    }
    
    // Se não houver categoria selecionada, retorna
    if (!categoryId) {
        return;
    }
    
    // Obtém o caminho da categoria
    const categoryPath = window.categoryManager.getCategoryPath(categoryId);
    if (!categoryPath) {
        console.warn(`Caminho não encontrado para categoria ID: ${categoryId}`);
        return;
    }
    
    // Divide o caminho em partes
    const pathParts = categoryPath.split(' > ');
    
    // Constrói o caminho de IDs
    let currentPath = [];
    let currentId = categoryId;
    
    // Adiciona a categoria atual
    const category = window.categoryManager.getCategoryById(categoryId);
    if (!category) {
        console.warn(`Categoria ID ${categoryId} não encontrada`);
        return;
    }
    
    currentPath.unshift({
        id: category.id,
        name: category.name
    });
    
    // Adiciona os pais recursivamente
    let parent = category;
    while (parent.parentId) {
        parent = window.categoryManager.getCategoryById(parent.parentId);
        if (parent) {
            currentPath.unshift({
                id: parent.id,
                name: parent.name
            });
        } else {
            break;
        }
    }
    
    // Adiciona cada parte ao breadcrumb
    currentPath.forEach(part => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#produtos?category=${part.id}`;
        link.dataset.id = part.id;
        link.textContent = part.name;
        
        // Adiciona evento de clique
        link.addEventListener('click', (e) => {
            e.preventDefault();
            selectCategory(part.id);
        });
        
        item.appendChild(link);
        breadcrumb.appendChild(item);
    });
}

/**
 * Filtra os produtos com base na categoria selecionada e no termo de pesquisa
 * @param {string|number} categoryId - ID da categoria
 */
function filterProducts(categoryId) {
    console.log('Iniciando filtragem de produtos');
    const searchInput = document.getElementById('search-input');
    const productsGrid = document.getElementById('products-grid');
    
    if (!searchInput || !productsGrid) {
        console.error('Elementos necessários para filtragem não encontrados');
        return;
    }
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    console.log(`Filtrando por categoria: ${categoryId}, termo: ${searchTerm}`);
    
    // Verifica se o ProductManager está disponível
    if (typeof productManager === 'undefined' || !window.productManager) {
        console.error('ProductManager não está definido ou não foi inicializado corretamente');
        return;
    }
    
    // Usa o ProductManager para filtrar produtos
    let filteredProducts;
    
    if (categoryId) {
        // Filtra por categoria (incluindo subcategorias)
        filteredProducts = productManager.getProductsByCategory(categoryId, true);
        console.log(`Filtrados ${filteredProducts.length} produtos pela categoria ${categoryId}`);
    } else {
        // Sem filtro de categoria
        filteredProducts = productManager.getAllProducts();
    }
    
    // Filtra por termo de pesquisa
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
        console.log(`Filtrados ${filteredProducts.length} produtos pelo termo "${searchTerm}"`);
    }
    
    // Limpa a grade de produtos
    productsGrid.innerHTML = '';
    
    // Verifica se há produtos
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
        return;
    }
    
    // Renderiza cada produto na grade
    renderProducts(filteredProducts);
}

/**
 * Inicializa o filtro de categorias
 */
async function initCategoryFilter() {
    console.log('Inicializando filtro de categorias');
    const categorySelect = document.getElementById('category-select');
    if (!categorySelect) {
        console.error('Elemento select de categorias não encontrado');
        return;
    }
    
    // Limpa o select
    categorySelect.innerHTML = '';
    
    try {
        // Adiciona a opção "Todas as categorias"
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Todas as categorias';
        categorySelect.appendChild(allOption);
        
        // Verifica se o CategoryManager está disponível
        if (typeof CategoryManager === 'undefined' || !window.categoryManager) {
            console.error('CategoryManager não está definido ou não foi inicializado corretamente');
            return;
        }
        
        // Usa a instância global do CategoryManager
        console.log('Usando CategoryManager para carregar categorias');
        
        // Obtém todas as categorias em formato plano
        const flatCategories = window.categoryManager.getFlatCategories();
        console.log(`Carregadas ${flatCategories.length} categorias hierárquicas`);
        
        // Adiciona as categorias ao select
        flatCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            
            // Adiciona indentação visual para subcategorias
            const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(category.level);
            option.textContent = category.level > 0 ? `${indent}${category.name}` : category.name;
            
            // Adiciona o caminho completo como atributo de dados
            option.dataset.path = category.path;
            
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao inicializar filtro de categorias:', error);
        
        // Fallback: adiciona apenas a opção "Todas as categorias"
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Todas as categorias';
        categorySelect.appendChild(allOption);
    }
    
    // Adiciona evento de mudança
    categorySelect.addEventListener('change', () => {
        console.log('Categoria selecionada:', categorySelect.value);
        filterProducts();
    });
    
    console.log('Filtro de categorias inicializado com sucesso');
}

/**
 * Inicializa a caixa de pesquisa
 */
function initSearchBox() {
    console.log('Inicializando caixa de pesquisa');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!searchInput || !searchButton || !suggestionsContainer) {
        console.error('Elementos de pesquisa não encontrados');
        return;
    }
    
    // Cache para armazenar resultados de pesquisa
    const searchCache = {};
    
    // Variáveis para controle de debounce
    let debounceTimeout;
    const debounceDelay = 300; // ms
    
    // Variáveis para navegação com teclado
    let selectedSuggestionIndex = -1;
    let suggestions = [];
    
    // Adiciona evento ao botão de pesquisa
    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();
        console.log(`Pesquisando por: "${searchTerm}"`);
        
        // Obtém a categoria atual da URL, se houver
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('category');
        
        // Filtra os produtos com o termo de pesquisa e categoria atual
        filterProducts(categoryId);
        
        // Esconde as sugestões
        hideSuggestions();
    });
    
    // Adiciona evento de tecla Enter
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            console.log(`Pesquisando por: "${searchTerm}" (via Enter)`);
            
            // Obtém a categoria atual da URL, se houver
            const urlParams = new URLSearchParams(window.location.search);
            const categoryId = urlParams.get('category');
            
            // Filtra os produtos com o termo de pesquisa e categoria atual
            filterProducts(categoryId);
            
            // Esconde as sugestões
            hideSuggestions();
        }
    });
    
    // Adiciona evento de input para mostrar sugestões
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        
        // Limpa o timeout anterior
        clearTimeout(debounceTimeout);
        
        // Se o termo de pesquisa estiver vazio, esconde as sugestões
        if (searchTerm.length === 0) {
            hideSuggestions();
            return;
        }
        
        // Define um novo timeout para evitar muitas requisições
        debounceTimeout = setTimeout(() => {
            // Verifica se já temos resultados em cache
            if (searchCache[searchTerm]) {
                showSuggestions(searchCache[searchTerm], searchTerm);
            } else {
                // Busca sugestões
                getSuggestions(searchTerm);
            }
        }, debounceDelay);
    });
    
    // Adiciona evento de foco para mostrar sugestões
    searchInput.addEventListener('focus', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length > 0) {
            if (searchCache[searchTerm]) {
                showSuggestions(searchCache[searchTerm], searchTerm);
            } else {
                getSuggestions(searchTerm);
            }
        }
    });
    
    // Adiciona evento de clique no documento para esconder sugestões
    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !suggestionsContainer.contains(event.target)) {
            hideSuggestions();
        }
    });
    
    // Adiciona evento de teclas para navegação
    searchInput.addEventListener('keydown', (event) => {
        // Se não houver sugestões visíveis, não faz nada
        if (!suggestionsContainer.classList.contains('active')) {
            return;
        }
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectNextSuggestion();
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectPreviousSuggestion();
                break;
            case 'Escape':
                event.preventDefault();
                hideSuggestions();
                break;
            case 'Tab':
                // Permite que o Tab funcione normalmente, mas esconde as sugestões
                hideSuggestions();
                break;
            case 'Enter':
                // Se houver uma sugestão selecionada, seleciona-a
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                    event.preventDefault();
                    selectSuggestion(suggestions[selectedSuggestionIndex]);
                }
                break;
        }
    });
    
    /**
     * Obtém sugestões com base no termo de pesquisa
     * @param {string} searchTerm - Termo de pesquisa
     */
    function getSuggestions(searchTerm) {
        console.log(`Buscando sugestões para: "${searchTerm}"`);
        
        // Verifica se o ProductManager está disponível
        if (typeof productManager === 'undefined' || !window.productManager) {
            console.error('ProductManager não está definido ou não foi inicializado corretamente');
            return;
        }
        
        // Obtém todos os produtos
        const allProducts = productManager.getAllProducts();
        
        // Filtra os produtos que correspondem ao termo de pesquisa
        const filteredProducts = allProducts.filter(product => {
            // Verifica no nome do produto
            if (product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            // Verifica na descrição do produto
            if (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            // Verifica na categoria do produto
            if (product.categoryPath && product.categoryPath.toLowerCase().includes(searchTerm.toLowerCase())) {
                return true;
            }
            
            return false;
        });
        
        // Limita a 10 sugestões
        const limitedResults = filteredProducts.slice(0, 10);
        
        // Armazena em cache
        searchCache[searchTerm] = limitedResults;
        
        // Mostra as sugestões
        showSuggestions(limitedResults, searchTerm);
    }
    
    /**
     * Mostra as sugestões na interface
     * @param {Array} suggestionsData - Lista de produtos sugeridos
     * @param {string} searchTerm - Termo de pesquisa
     */
    function showSuggestions(suggestionsData, searchTerm) {
        // Atualiza a lista de sugestões
        suggestions = suggestionsData;
        
        // Limpa o container de sugestões
        suggestionsContainer.innerHTML = '';
        
        // Se não houver sugestões, mostra uma mensagem
        if (suggestionsData.length === 0) {
            suggestionsContainer.innerHTML = '<div class="no-suggestions">Nenhum produto encontrado</div>';
            suggestionsContainer.classList.add('active');
            return;
        }
        
        // Cria um elemento para cada sugestão
        suggestionsData.forEach((product, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.dataset.index = index;
            
            // Obtém a URL da imagem
            let imageUrl = product.imageUrl || product.image;
            if (!imageUrl || imageUrl === '') {
                imageUrl = `https://placehold.co/80x80/4a90e2/ffffff?text=${encodeURIComponent(product.name.substring(0, 10))}`;
            } else if (imageUrl.startsWith('img/')) {
                // Adiciona caminho relativo
                if (!imageUrl.startsWith('/')) {
                    imageUrl = '/' + imageUrl;
                }
            }
            
            // Destaca o termo de pesquisa no nome do produto
            const highlightedName = highlightText(product.name, searchTerm);
            
            // Obtém o caminho da categoria
            let categoryPath = '';
            if (product.categoryPath) {
                categoryPath = product.categoryPath;
            } else if (product.categoryId && window.categoryManager) {
                categoryPath = window.categoryManager.getCategoryPath(product.categoryId);
            }
            
            // Formata o preço
            let price = 0;
            if (product.sale && product.salePrice) {
                price = parseFloat(product.salePrice);
            } else if (product.price) {
                price = parseFloat(product.price);
            }
            const formattedPrice = formatPrice(price);
            
            // Constrói o HTML da sugestão
            suggestionItem.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="suggestion-image" onerror="this.src='https://placehold.co/80x80/cccccc/666666?text=Erro'">
                <div class="suggestion-content">
                    <div class="suggestion-title">${highlightedName}</div>
                    <div class="suggestion-category">${categoryPath || 'Sem categoria'}</div>
                </div>
                <div class="suggestion-price">${formattedPrice}</div>
            `;
            
            // Adiciona evento de clique
            suggestionItem.addEventListener('click', () => {
                selectSuggestion(product);
            });
            
            // Adiciona a sugestão ao container
            suggestionsContainer.appendChild(suggestionItem);
        });
        
        // Mostra o container de sugestões
        suggestionsContainer.classList.add('active');
        
        // Reseta o índice selecionado
        selectedSuggestionIndex = -1;
    }
    
    /**
     * Esconde as sugestões
     */
    function hideSuggestions() {
        suggestionsContainer.classList.remove('active');
        selectedSuggestionIndex = -1;
    }
    
    /**
     * Seleciona uma sugestão
     * @param {Object} product - Produto selecionado
     */
    function selectSuggestion(product) {
        console.log(`Sugestão selecionada: ${product.name}`);
        
        // Preenche o campo de pesquisa com o nome do produto
        searchInput.value = product.name;
        
        // Esconde as sugestões
        hideSuggestions();
        
        // Abre o modal do produto
        openProductModal(product.id);
    }
    
    /**
     * Seleciona a próxima sugestão
     */
    function selectNextSuggestion() {
        if (suggestions.length === 0) return;
        
        // Remove a seleção atual
        const currentSelected = suggestionsContainer.querySelector('.suggestion-item.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        
        // Incrementa o índice
        selectedSuggestionIndex = (selectedSuggestionIndex + 1) % suggestions.length;
        
        // Seleciona o novo item
        const newSelected = suggestionsContainer.querySelector(`.suggestion-item[data-index="${selectedSuggestionIndex}"]`);
        if (newSelected) {
            newSelected.classList.add('selected');
            
            // Garante que o item selecionado esteja visível
            newSelected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    /**
     * Seleciona a sugestão anterior
     */
    function selectPreviousSuggestion() {
        if (suggestions.length === 0) return;
        
        // Remove a seleção atual
        const currentSelected = suggestionsContainer.querySelector('.suggestion-item.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        
        // Decrementa o índice
        selectedSuggestionIndex = (selectedSuggestionIndex - 1 + suggestions.length) % suggestions.length;
        
        // Seleciona o novo item
        const newSelected = suggestionsContainer.querySelector(`.suggestion-item[data-index="${selectedSuggestionIndex}"]`);
        if (newSelected) {
            newSelected.classList.add('selected');
            
            // Garante que o item selecionado esteja visível
            newSelected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    /**
     * Destaca o texto de pesquisa em uma string
     * @param {string} text - Texto original
     * @param {string} highlight - Texto a ser destacado
     * @returns {string} Texto com destaque HTML
     */
    function highlightText(text, highlight) {
        if (!highlight) return text;
        
        const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
        return text.replace(regex, '<span class="suggestion-highlight">$1</span>');
    }
    
    /**
     * Escapa caracteres especiais para uso em regex
     * @param {string} string - String a ser escapada
     * @returns {string} String escapada
     */
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    console.log('Caixa de pesquisa inicializada com sucesso');
}

/**
 * Inicializa o modal do carrinho
 */
function initCartModal() {
    const cartButton = document.getElementById('cart-button');
    const cartModal = document.getElementById('cart-modal');
    const closeButton = cartModal.querySelector('.close');
    const clearCartButton = document.getElementById('clear-cart');
    const checkoutButton = document.getElementById('checkout-button');
    
    // Abre o modal do carrinho
    cartButton.addEventListener('click', (event) => {
        event.preventDefault();
        Cart.renderCartItems();
        cartModal.style.display = 'block';
    });
    
    // Fecha o modal
    closeButton.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });
    
    // Fecha o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    // Limpa o carrinho
    clearCartButton.addEventListener('click', () => {
        Cart.clearCart();
    });
    
    // Finaliza a compra
    checkoutButton.addEventListener('click', () => {
        checkout();
    });
}

/**
 * Atualiza o conteúdo do modal do carrinho
 */
function updateCartModal() {
    console.log('Atualizando modal do carrinho');
    
    // Obtém os elementos do modal
    const cartItems = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    
    if (!cartItems || !cartTotalPrice) {
        console.error('Elementos do modal do carrinho não encontrados');
        return;
    }
    
    // Obtém os itens do carrinho
    const cart = JSON.parse(localStorage.getItem('cart_items') || localStorage.getItem('cart') || '[]');
    
    // Limpa o conteúdo
    cartItems.innerHTML = '';
    
    // Verifica se há itens
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio.</p>';
        cartTotalPrice.textContent = formatPrice(0);
        console.log('Carrinho vazio');
        return;
    }
    
    // Calcula o total
    let total = 0;
    
    // Renderiza cada item
    cart.forEach(item => {
        // Calcula o subtotal do item
        const subtotal = item.price * item.quantity;
        total += subtotal;
        
        // Obtém a URL da imagem
        let imageUrl = item.image;
        if (item.image && item.image.startsWith('img/')) {
            const imageData = localStorage.getItem(item.image);
            if (imageData) {
                imageUrl = imageData;
            } else {
                imageUrl = `https://placehold.co/80x80/4a90e2/ffffff?text=${encodeURIComponent(item.name.substring(0, 10))}`;
            }
        }
        
        // Cria o elemento do item
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${imageUrl}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
                <div class="cart-item-quantity">
                    <button class="decrease-btn" data-id="${item.id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" max="${item.stock}" data-id="${item.id}">
                    <button class="increase-btn" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Adiciona eventos aos botões
        const decreaseBtn = itemElement.querySelector('.decrease-btn');
        const increaseBtn = itemElement.querySelector('.increase-btn');
        const quantityInput = itemElement.querySelector('input');
        const removeBtn = itemElement.querySelector('.cart-item-remove');
        
        decreaseBtn.addEventListener('click', () => {
            const newQuantity = item.quantity - 1;
            if (newQuantity > 0) {
                updateCartItemQuantity(item.id, newQuantity);
            } else {
                removeFromCart(item.id);
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const newQuantity = item.quantity + 1;
            if (newQuantity <= item.stock) {
                updateCartItemQuantity(item.id, newQuantity);
            } else {
                showNotification('Quantidade máxima atingida!', 'error');
            }
        });
        
        quantityInput.addEventListener('change', () => {
            const newQuantity = parseInt(quantityInput.value);
            if (newQuantity > 0 && newQuantity <= item.stock) {
                updateCartItemQuantity(item.id, newQuantity);
            } else if (newQuantity > item.stock) {
                showNotification('Quantidade máxima atingida!', 'error');
                quantityInput.value = item.quantity;
            } else {
                quantityInput.value = 1;
                updateCartItemQuantity(item.id, 1);
            }
        });
        
        removeBtn.addEventListener('click', () => {
            removeFromCart(item.id);
        });
        
        cartItems.appendChild(itemElement);
    });
    
    // Atualiza o total
    cartTotalPrice.textContent = formatPrice(total);
    console.log(`Modal do carrinho atualizado: ${cart.length} itens, total: ${formatPrice(total)}`);
}

/**
 * Formata o preço para exibição
 * @param {number} price - Preço a ser formatado
 * @returns {string} Preço formatado
 */
function formatPrice(price) {
    // Verifica se o preço é nulo ou indefinido
    if (price === null || price === undefined) {
        return 'R$ 0,00';
    }
    
    // Garante que o preço é um número
    const numPrice = parseFloat(price) || 0;
    
    return numPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * Inicializa o modal de produto
 */
function initProductModal() {
    console.log('Inicializando modal de produto');
    
    const modal = document.getElementById('product-modal');
    const closeBtn = modal.querySelector('.close');
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('product-modal-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-button');
    
    if (!modal || !closeBtn) {
        console.error('Elementos do modal de produto não encontrados');
        return;
    }
    
    // Fecha o modal ao clicar no X
    closeBtn.addEventListener('click', () => {
        console.log('Botão fechar clicado');
        modal.style.display = 'none';
    });
    
    // Fecha o modal ao clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            console.log('Clique fora do modal detectado');
            modal.style.display = 'none';
        }
    });
    
    // Fecha o modal ao pressionar ESC
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            console.log('Tecla ESC pressionada');
            modal.style.display = 'none';
        }
    });
    
    // Diminui a quantidade
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            if (quantity > 1) {
                quantityInput.value = quantity - 1;
            }
        });
    }
    
    // Aumenta a quantidade
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            quantityInput.value = quantity + 1;
        });
    }
    
    // Impede valores inválidos
    if (quantityInput) {
        quantityInput.addEventListener('change', () => {
            let quantity = parseInt(quantityInput.value);
            if (isNaN(quantity) || quantity < 1) {
                quantityInput.value = 1;
            }
        });
    }
    
    console.log('Modal de produto inicializado com sucesso');
}

/**
 * Abre o modal de produto
 * @param {number} productId - ID do produto
 */
function openProductModal(productId) {
    console.log(`Abrindo modal para produto ID: ${productId}`);
    
    // Obtém o produto através do productManager
    const product = productManager.getProductById(productId);
    
    if (!product) {
        console.error(`Produto ID ${productId} não encontrado`);
        showNotification('Produto não encontrado!', 'error');
        return;
    }
    
    console.log(`Produto encontrado: ${product.name}`);
    
    // Obtém os elementos do modal
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('product-modal-title');
    const modalImg = document.getElementById('product-modal-img');
    const modalCategory = document.getElementById('product-modal-category');
    const modalDescription = document.getElementById('product-modal-description');
    const modalPrice = document.getElementById('product-modal-price');
    const modalStock = document.getElementById('product-modal-stock');
    const modalQuantity = document.getElementById('product-modal-quantity');
    const addToCartButton = document.getElementById('add-to-cart-button');
    const closeButton = modal.querySelector('.close');
    
    // Adiciona evento ao botão de fechar
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
    
    // Adiciona evento para fechar ao clicar fora do modal
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
    
    // Adiciona evento para fechar ao pressionar ESC
    const escKeyHandler = function(event) {
        if (event.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', escKeyHandler);
        }
    };
    document.addEventListener('keydown', escKeyHandler);
    
    // Obtém a URL da imagem
    let imageUrl = product.image;
    if (!imageUrl || imageUrl === '') {
        imageUrl = `https://placehold.co/300x200/4a90e2/ffffff?text=${encodeURIComponent(product.name.substring(0, 20))}`;
    } else if (imageUrl.startsWith('img/')) {
        // Adiciona caminho relativo
        if (!imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }
    }
    
    // Preenche os dados do produto
    modalTitle.textContent = product.name;
    modalImg.src = imageUrl;
    modalImg.alt = product.name;
    
    // Tenta obter o caminho da categoria
    if (modalCategory) {
        let categoryPath = '';
        if (product.categoryPath) {
            categoryPath = product.categoryPath;
        } else if (product.categoryId && window.categoryManager) {
            categoryPath = window.categoryManager.getCategoryPath(product.categoryId);
        }
        
        modalCategory.textContent = categoryPath || 'Sem categoria';
    }
    
    // Preenche a descrição
    modalDescription.textContent = product.description || 'Sem descrição';
    
    // Formata o preço
    if (product.sale && product.salePrice) {
        const formattedPrice = formatPrice(product.salePrice);
        const formattedOriginalPrice = formatPrice(product.price);
        modalPrice.innerHTML = `<span class="original-price">${formattedOriginalPrice}</span>${formattedPrice}`;
    } else {
        modalPrice.textContent = formatPrice(product.price);
    }
    
    // Exibe informações de estoque
    const isOutOfStock = product.stock <= 0;
    if (modalStock) {
        modalStock.textContent = isOutOfStock ? 'Produto esgotado' : `Em estoque: ${product.stock} unidades`;
        modalStock.className = isOutOfStock ? 'product-stock out-of-stock' : 'product-stock';
    }
    
    // Reseta a quantidade
    modalQuantity.value = 1;
    modalQuantity.max = product.stock;
    
    // Desabilita o botão se estiver fora de estoque
    if (addToCartButton) {
        if (isOutOfStock) {
            addToCartButton.disabled = true;
            addToCartButton.textContent = 'Produto Esgotado';
        } else {
            addToCartButton.disabled = false;
            addToCartButton.textContent = 'Adicionar ao Carrinho';
            
            // Adiciona evento ao botão de adicionar ao carrinho
            addToCartButton.onclick = () => {
                const quantity = parseInt(modalQuantity.value);
                if (quantity > 0 && quantity <= product.stock) {
                    addToCart(product.id, quantity);
                    modal.style.display = 'none';
                } else {
                    showNotification('Quantidade inválida!', 'error');
                }
            };
        }
    }
    
    // Exibe o modal
    modal.style.display = 'block';
    console.log('Modal de produto aberto com sucesso');
}

/**
 * Exibe uma notificação
 * @param {string} message - Mensagem da notificação
 * @param {string} type - Tipo da notificação (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Cria o elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adiciona ao corpo do documento
    document.body.appendChild(notification);
    
    // Exibe a notificação
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove a notificação após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Inicializa o carrossel
 */
async function initCarousel() {
    console.log('Iniciando inicialização do carrossel');
    
    const slidesContainer = document.getElementById('carousel-slides');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    const carouselContainer = document.querySelector('.carousel-container');
    
    if (!slidesContainer || !indicatorsContainer || !prevButton || !nextButton) {
        console.error('Elementos do carrossel não encontrados no DOM:',
            !slidesContainer ? 'slidesContainer não encontrado' : '',
            !indicatorsContainer ? 'indicatorsContainer não encontrado' : '',
            !prevButton ? 'prevButton não encontrado' : '',
            !nextButton ? 'nextButton não encontrado' : '');
        return;
    }
    
    // Carrega os slides do carrossel
    await loadCarouselSlides();
    
    // Configura os controles do carrossel
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    
    console.log(`Total de slides encontrados após carregamento: ${totalSlides}`);
    
    if (totalSlides === 0) {
        console.error('Nenhum slide foi carregado, o carrossel não será inicializado');
        return;
    }
    
    let currentSlide = 0;
    
    // Adiciona evento aos botões de navegação
    prevButton.addEventListener('click', (e) => {
        e.preventDefault();
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarousel();
    });
    
    nextButton.addEventListener('click', (e) => {
        e.preventDefault();
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    });
    
    // Adiciona evento aos indicadores
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', (e) => {
            e.preventDefault();
            currentSlide = index;
            updateCarousel();
        });
    });
    
    // Adiciona eventos de toque para dispositivos móveis
    let touchStartX = 0;
    let touchEndX = 0;
    
    slidesContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slidesContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50; // Mínimo de pixels para considerar um swipe
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe para a esquerda - próximo slide
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe para a direita - slide anterior
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        }
    }
    
    // Função para atualizar o carrossel
    function updateCarousel() {
        // Atualiza a posição dos slides
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Atualiza os indicadores
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // Inicia o carrossel automático
    let interval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarousel();
    }, 5000);
    
    // Pausa o carrossel ao passar o mouse ou tocar
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        }, 5000);
    });
    
    carouselContainer.addEventListener('touchstart', () => {
        clearInterval(interval);
    }, { passive: true });
    
    carouselContainer.addEventListener('touchend', () => {
        interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        }, 5000);
    }, { passive: true });
    
    console.log('Carrossel inicializado com sucesso');
}

/**
 * Carrega os slides do carrossel
 */
async function loadCarouselSlides() {
    try {
        console.log('Iniciando carregamento dos slides do carrossel');
        
        // Limpa os containers antes de começar
        const slidesContainer = document.getElementById('carousel-slides');
        const indicatorsContainer = document.getElementById('carousel-indicators');
        
        if (!slidesContainer || !indicatorsContainer) {
            console.error('Containers do carrossel não encontrados no DOM');
            return;
        }
        
        slidesContainer.innerHTML = '';
        indicatorsContainer.innerHTML = '';
        
        // Carrega os slides da API
        let slidesData = [];
        try {
            slidesData = await window.api.getCarouselSlides();
            // Garante que slidesData seja um array
            if (!Array.isArray(slidesData)) {
                console.warn('Dados de slides recebidos não são um array, convertendo...');
                slidesData = Array.isArray(slidesData) ? slidesData : [];
            }
            console.log(`${slidesData.length} slides carregados da API`);
        } catch (error) {
            console.error('Erro ao carregar slides da API:', error);
            slidesData = [];
        }
        
        // Se não houver slides, cria slides padrão
        if (!slidesData || slidesData.length === 0) {
            console.log('Nenhum slide encontrado, criando slides padrão');
            // Cria slides padrão
            const defaultSlides = [
                {
                    id: 1,
                    title: "Apoio Entrega",
                    subtitle: "Sua loja online de confiança",
                    buttonText: "",
                    buttonLink: "",
                    image: "https://placehold.co/1920x500/4a90e2/ffffff?text=Apoio+Entrega",
                    order: 1
                },
                {
                    id: 2,
                    title: "Produtos de Qualidade",
                    subtitle: "As melhores marcas para você",
                    buttonText: "",
                    buttonLink: "",
                    image: "https://placehold.co/1920x500/f5a623/ffffff?text=Produtos+de+Qualidade",
                    order: 2
                },
                {
                    id: 3,
                    title: "Equipamentos Profissionais",
                    subtitle: "Tudo para seu negócio",
                    buttonText: "",
                    buttonLink: "",
                    image: "https://placehold.co/1920x500/28a745/ffffff?text=Equipamentos+Profissionais",
                    order: 3
                }
            ];
            
            // Salva os slides padrão via API
            try {
                for (const slide of defaultSlides) {
                    await window.api.addSlide(slide);
                }
                slidesData = await window.api.getCarouselSlides();
                // Garante que slidesData seja um array
                slidesData = Array.isArray(slidesData) ? slidesData : [];
                console.log('Slides padrão criados e salvos via API');
            } catch (error) {
                console.error('Erro ao salvar slides padrão:', error);
                slidesData = defaultSlides; // Usa localmente em caso de erro
            }
        }
        
        console.log(`Renderizando ${slidesData.length} slides`);
        
        // Ordena os slides apenas se for um array
        if (Array.isArray(slidesData)) {
            slidesData.sort((a, b) => (a.order || 0) - (b.order || 0));
        } else {
            console.error('Slides não é um array, não é possível ordenar');
        }
        
        // Adiciona cada slide
        slidesData.forEach((slide, index) => {
            // Cria o elemento do slide
            const slideElement = document.createElement('div');
            slideElement.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
            
            // Trata a URL da imagem - substituindo via.placeholder.com por placehold.co
            let imageUrl = slide.image;
            if (imageUrl && imageUrl.includes('via.placeholder.com')) {
                imageUrl = imageUrl.replace('via.placeholder.com', 'placehold.co');
            }
            
            // Se a imagem não começa com http/https e não começa com /, adiciona /
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            
            // Define o HTML do slide
            slideElement.innerHTML = `
                <img src="${imageUrl}" alt="${slide.title}" onerror="this.src='https://placehold.co/1920x500/cccccc/666666?text=Imagem+não+encontrada'">
                <div class="carousel-caption">
                    <h2>${slide.title}</h2>
                    <p>${slide.subtitle || ''}</p>
                    ${slide.buttonText ? `<a href="${slide.buttonLink || '#'}" class="btn">${slide.buttonText}</a>` : ''}
                </div>
            `;
            
            // Adiciona o slide ao container
            slidesContainer.appendChild(slideElement);
            
            // Cria o indicador
            const indicator = document.createElement('button');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicator.setAttribute('aria-label', `Slide ${index + 1}`);
            
            // Adiciona o indicador ao container
            indicatorsContainer.appendChild(indicator);
        });
        
        console.log('Carregamento dos slides concluído com sucesso');
    } catch (error) {
        console.error('Erro ao carregar slides do carrossel:', error);
        
        // Cria um slide de emergência em caso de erro
        try {
            const slidesContainer = document.getElementById('carousel-slides');
            const indicatorsContainer = document.getElementById('carousel-indicators');
            
            if (slidesContainer && indicatorsContainer) {
                slidesContainer.innerHTML = '';
                indicatorsContainer.innerHTML = '';
                
                const slideElement = document.createElement('div');
                slideElement.className = 'carousel-slide active';
                slideElement.style.backgroundImage = 'url(https://placehold.co/1920x500/4a90e2/ffffff?text=Apoio+Entrega)';
                
                slidesContainer.appendChild(slideElement);
                
                const indicator = document.createElement('button');
                indicator.className = 'indicator active';
                indicator.setAttribute('aria-label', 'Slide 1');
                
                indicatorsContainer.appendChild(indicator);
                
                console.log('Slide de emergência criado com sucesso');
            }
        } catch (e) {
            console.error('Falha total ao criar slide de emergência:', e);
        }
    }
}

/**
 * Carrega os produtos usando o ProductManager
 */
async function loadProducts() {
    // Verifica se o productManager já foi inicializado
    if (typeof productManager === 'undefined') {
        console.error('ProductManager não está definido. Verifique se o arquivo products.js está sendo carregado corretamente.');
        return;
    }
    
    try {
        // Força o recarregamento dos produtos
        await productManager.loadProducts();
        
        // Aguarda o carregamento dos produtos
        return new Promise(resolve => {
            const checkProducts = () => {
                if (productManager.getAllProducts().length > 0) {
                    console.log('Produtos carregados com sucesso:', productManager.getAllProducts().length);
                    resolve();
                } else {
                    console.log('Aguardando carregamento dos produtos...');
                    setTimeout(checkProducts, 100);
                }
            };
            checkProducts();
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Função para atualizar o estoque de um produto
async function updateProductStock(productId, quantity) {
    try {
        // Obtém o produto atual
        const product = await window.api.getProductById(productId);
        if (!product) {
            console.error(`Produto não encontrado: ${productId}`);
            return -1;
        }
        
        // Calcula o novo estoque
        const newStock = product.stock - quantity;
        
        // Atualiza o produto via API
        await window.api.updateProduct({
            ...product,
            stock: newStock
        });
        
        // Atualiza o productManager local
        if (productManager) {
            await productManager.loadProducts();
        }
        
        return newStock;
    } catch (error) {
        console.error(`Erro ao atualizar estoque do produto ${productId}:`, error);
        return -1;
    }
}

// Função para verificar se um produto está esgotado
async function isProductOutOfStock(productId) {
    try {
        // Obtém o produto atual
        const product = await window.api.getProductById(productId);
        
        // Verifica se o produto existe e se tem estoque
        return !product || product.stock <= 0;
    } catch (error) {
        console.error(`Erro ao verificar estoque do produto ${productId}:`, error);
        return true; // Por segurança, considera esgotado em caso de erro
    }
}

/**
 * Adiciona um produto ao carrinho
 * @param {number} productId - ID do produto
 * @param {number} quantity - Quantidade a ser adicionada
 */
async function addToCart(productId, quantity = 1) {
    try {
        // Verifica se o produto está esgotado
        const outOfStock = await isProductOutOfStock(productId);
        
        if (outOfStock) {
            showNotification('Produto esgotado', 'error');
            return false;
        }
        
        // Adiciona ao carrinho
        Cart.addToCart({
            id: productId,
            quantity: quantity
        });
        
        // Atualiza o estoque
        await updateProductStock(productId, quantity);
        
        // Exibe notificação de sucesso
        showNotification('Produto adicionado ao carrinho', 'success');
        
        return true;
    } catch (error) {
        console.error('Erro ao adicionar produto ao carrinho:', error);
        showNotification('Erro ao adicionar produto', 'error');
        return false;
    }
}

/**
 * Atualiza a quantidade de um item no carrinho
 * @param {number} productId - ID do produto
 * @param {number} quantity - Nova quantidade
 */
function updateCartItemQuantity(productId, quantity) {
    Cart.updateQuantity(productId, quantity);
}

/**
 * Remove um produto do carrinho
 * @param {number} productId - ID do produto
 */
function removeFromCart(productId) {
    Cart.removeFromCart(productId);
}

/**
 * Inicia o processo de checkout redirecionando para a página de finalização de compra
 */
function checkout() {
    console.log('Iniciando processo de checkout');
    
    // Obtém os itens do carrinho usando o Cart module
    const cart = Cart.getItems();
    
    // Verifica se o carrinho está vazio
    if (cart.length === 0) {
        console.warn('Tentativa de checkout com carrinho vazio');
        showNotification('Carrinho vazio!', 'error');
        return;
    }

    // Verifica estoque dos produtos via API
    try {
        // Nota: A verificação de estoque agora é feita automaticamente pelo addToCart
        // Não é necessário verificar novamente aqui
        
        // Fecha o modal do carrinho
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.display = 'none';
        }

        // Redireciona para a página de checkout
        window.location.href = 'checkout.html';
    } catch (error) {
        console.error('Erro ao processar checkout:', error);
        showNotification('Erro ao processar checkout', 'error');
    }
}

// Exponha a função checkout no escopo global para que possa ser usada por outros scripts
window.checkout = checkout;

/**
 * Atualiza o contador de itens no carrinho
 */
function updateCartCount() {
    console.log('Atualizando contador do carrinho');
    
    // Obtém o elemento do contador
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) {
        console.error('Elemento contador do carrinho não encontrado');
        return;
    }
    
    // Obtém os itens do carrinho - compatibilidade com ambas as chaves
    const cart = JSON.parse(localStorage.getItem('cart_items') || localStorage.getItem('cart') || '[]');
    
    // Calcula o total de itens
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Atualiza o contador
    cartCount.textContent = totalItems;
    console.log(`Contador do carrinho atualizado: ${totalItems} itens`);
}

/**
 * Renderiza produtos na grade
 * @param {Array} products - Lista de produtos para renderizar
 */
function renderProducts(products = null) {
    console.log('Renderizando produtos na grade');
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) {
        console.error('Elemento grid de produtos não encontrado');
        return;
    }
    
    // Se não receber produtos, usa o ProductManager para obter todos
    if (!products) {
        if (typeof productManager !== 'undefined' && window.productManager) {
            products = window.productManager.getAllProducts();
            console.log(`Carregados ${products.length} produtos do ProductManager`);
        } else {
            products = JSON.parse(localStorage.getItem('products') || '[]');
            console.log(`Carregados ${products.length} produtos do localStorage`);
        }
    } else {
        console.log(`Renderizando ${products.length} produtos filtrados`);
    }
    
    // Limpa a grade de produtos
    productsGrid.innerHTML = '';
    
    // Verifica se há produtos
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
        return;
    }

    // Renderiza cada produto
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
} 