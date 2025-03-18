/**
 * Sistema de Administração
 * Versão 2.0
 */

// Document Ready
document.addEventListener('DOMContentLoaded', async function() {
    // Adicionar estilos para a mensagem de funcionalidade em desenvolvimento
    const style = document.createElement('style');
    style.textContent = `
        .section-message {
            padding: 20px;
            margin: 20px 0;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-left: 5px solid #6c757d;
            font-size: 16px;
            color: #495057;
            text-align: center;
        }
    `;
    document.head.appendChild(style);
    
    await initAdmin();
});

/**
 * Inicializa o painel administrativo
 */
async function initAdmin() {
    console.log('Inicializando painel administrativo...');
    
    // Garantir que o ApiService está inicializado
    if (!window.api || !window.apiService) {
        console.log('Inicializando ApiService...');
        window.api = new ApiService();
        window.apiService = window.api;
    }
    
    // Garantir que o CategoryManager está inicializado
    if (!window.categoryManager) {
        console.log('Inicializando CategoryManager...');
        window.categoryManager = new CategoryManager();
    }
    
    // Garantir que o ProductManager está inicializado
    if (!window.productManager) {
        console.log('Inicializando ProductManager...');
        window.productManager = new ProductManager();
    }
    
    // Inicializa os componentes principais
    initSidebar();
    initModals();
    initImageUpload();
    initCarouselData();
    
    // Carrega a seção inicial (produtos por padrão)
    const defaultSection = document.querySelector('.sidebar-item');
    if (defaultSection) {
        defaultSection.click();
    }
}

/**
 * Inicializa os dados do carrossel
 */
async function initCarouselData() {
    try {
        console.log('Inicializando dados do carrossel...');
        
        // Verifica se existem dados em qualquer um dos sistemas
        const hasAdminData = localStorage.getItem('carousel') !== null;
        const hasMainData = localStorage.getItem('carouselSlides') !== null;
        
        if (!hasAdminData && !hasMainData) {
            console.log('Nenhum dado de carrossel encontrado, criando dados padrão...');
            
            // Cria slides padrão
            const defaultSlides = [
                {
                    id: 1,
                    title: "Apoio Entrega",
                    subtitle: "Sua loja online de confiança",
                    buttonText: "",
                    buttonLink: "",
                    image: "https://via.placeholder.com/1920x500/4a90e2/ffffff?text=Apoio+Entrega",
                    order: 1
                },
                {
                    id: 2,
                    title: "Produtos de Qualidade",
                    subtitle: "As melhores marcas para você",
                    buttonText: "",
                    buttonLink: "",
                    image: "https://via.placeholder.com/1920x500/f5a623/ffffff?text=Produtos+de+Qualidade",
                    order: 2
                },
                {
                    id: 3,
                    title: "Equipamentos Profissionais",
                    subtitle: "Tudo para seu negócio",
                    buttonText: "",
                    buttonLink: "",
                    image: "https://via.placeholder.com/1920x500/28a745/ffffff?text=Equipamentos+Profissionais",
                    order: 3
                }
            ];
            
            // Cria itens para o painel admin
            const adminItems = defaultSlides.map(slide => ({
                title: slide.title || `Slide ${slide.id}`,
                description: slide.subtitle || '',
                link: slide.buttonLink || '',
                image: slide.image,
                order: slide.order
            }));
            
            // Salva em ambos os sistemas
            localStorage.setItem('carousel', JSON.stringify(adminItems));
            localStorage.setItem('carouselSlides', JSON.stringify(defaultSlides));
            
            console.log('Dados padrão do carrossel criados com sucesso');
        } 
        else if (hasAdminData && !hasMainData) {
            // Tem dados no admin mas não no main
            console.log('Sincronizando dados do admin para o main...');
            const adminItems = JSON.parse(localStorage.getItem('carousel'));
            
            // Converte para o formato do main
            const mainSlides = adminItems.map((item, index) => ({
                id: item.id || Date.now() + index,
                title: item.title,
                subtitle: item.description,
                buttonText: '',
                buttonLink: item.link,
                image: item.image,
                order: index + 1
            }));
            
            localStorage.setItem('carouselSlides', JSON.stringify(mainSlides));
            console.log('Dados sincronizados do admin para o main');
        } 
        else if (!hasAdminData && hasMainData) {
            // Tem dados no main mas não no admin
            console.log('Sincronizando dados do main para o admin...');
            const mainSlides = JSON.parse(localStorage.getItem('carouselSlides'));
            
            // Converte para o formato do admin
            const adminItems = mainSlides.map(slide => ({
                id: slide.id,
                title: slide.title,
                subtitle: slide.subtitle,
                buttonText: '',
                buttonLink: slide.buttonLink,
                image: slide.image,
                order: slide.order
            }));
            
            localStorage.setItem('carousel', JSON.stringify(adminItems));
            console.log('Dados sincronizados do main para o admin');
        }
        else {
            // Ambos têm dados, verifica se estão sincronizados
            console.log('Verificando sincronização entre os sistemas...');
            const adminItems = JSON.parse(localStorage.getItem('carousel'));
            const mainSlides = JSON.parse(localStorage.getItem('carouselSlides'));
            
            // Verifica se todos os slides do main têm correspondência no admin
            const mainIds = mainSlides.map(slide => slide.id);
            const adminIds = adminItems.map(item => item.id).filter(id => id);
            
            const needsSync = !mainIds.every(id => adminIds.includes(id)) || 
                             !adminIds.every(id => mainIds.includes(id)) ||
                             mainIds.length !== adminIds.length;
            
            if (needsSync) {
                console.log('Inconsistência detectada, sincronizando sistemas...');
                
                // Usa os dados do main como fonte da verdade
                const syncedAdminItems = mainSlides.map(slide => ({
                    id: slide.id,
                    title: slide.title,
                    subtitle: slide.subtitle,
                    buttonText: '',
                    buttonLink: slide.buttonLink,
                    image: slide.image,
                    order: slide.order
                }));
                
                localStorage.setItem('carousel', JSON.stringify(syncedAdminItems));
                console.log('Sistemas sincronizados com sucesso');
            } else {
                console.log('Sistemas já estão sincronizados');
            }
        }
        
        // Garante que existam arrays vazios se algo deu errado
        if (!localStorage.getItem('carousel')) {
            localStorage.setItem('carousel', JSON.stringify([]));
        }
        if (!localStorage.getItem('carouselSlides')) {
            localStorage.setItem('carouselSlides', JSON.stringify([]));
        }
        
        console.log('Inicialização dos dados do carrossel concluída');
    } catch (error) {
        console.error('Erro ao inicializar dados do carrossel:', error);
        // Garante que existam arrays vazios mesmo em caso de erro
        localStorage.setItem('carousel', JSON.stringify([]));
        localStorage.setItem('carouselSlides', JSON.stringify([]));
    }
}

/**
 * Inicializa a barra lateral
 */
function initSidebar() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', async () => {
            // Remove a classe ativa de todos os itens
            sidebarItems.forEach(i => i.classList.remove('active'));
            
            // Adiciona a classe ativa ao item clicado
            item.classList.add('active');
            
            // Obtém o ID da seção
            const sectionId = item.getAttribute('data-section');
            
            // Atualiza o título da página
            updatePageTitle(sectionId);
            
            // Carrega a seção correspondente
            await loadSection(sectionId);
        });
    });
}

/**
 * Atualiza o título da página
 */
function updatePageTitle(sectionId) {
    const titleElement = document.getElementById('page-title');
    if (!titleElement) return;
    
    const titles = {
        products: 'Gerenciar Produtos',
        categories: 'Gerenciar Categorias',
        carousel: 'Gerenciar Carrossel',
        orders: 'Gerenciar Pedidos'
    };
    
    titleElement.textContent = titles[sectionId] || 'Painel Administrativo';
}

/**
 * Carrega uma seção específica
 */
async function loadSection(sectionId) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    // Limpa o conteúdo atual
    mainContent.innerHTML = '';
    
    // Carrega a seção apropriada
    switch (sectionId) {
        case 'products':
            await initProductsSection();
            break;
        case 'categories':
            await initCategoriesSection();
            break;
        case 'carousel':
            await initCarouselSection();
            break;
        case 'orders':
            await initOrdersSection();
            break;
    }
}

/**
 * Inicializa a seção de produtos
 */
async function initProductsSection() {
    console.log('Inicializando seção de produtos...');
    const mainContent = document.getElementById('main-content');
    
    // Cria o HTML da seção
    mainContent.innerHTML = `
        <div class="section-header">
            <button class="add-button" onclick="openProductModal()">
                <i class="fas fa-plus"></i> Novo Produto
            </button>
            <div class="search-box">
                <input type="text" id="product-search" placeholder="Buscar produtos...">
                <select id="category-filter">
                    <option value="">Todas as categorias</option>
                </select>
            </div>
        </div>
        <div class="products-container">
            <table id="products-table" class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Imagem</th>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="7" class="loading-message">Carregando produtos...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Inicializa o filtro de categorias
    updateCategoryFilter();
    
    // Inicializa a busca
    initProductSearch();
    
    try {
        // Carrega os produtos de forma assíncrona
        loadProducts().catch(error => {
            console.error('Erro ao carregar produtos:', error);
            const tableBody = document.querySelector('#products-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="7" class="error-message">Erro ao carregar produtos: ${error.message}</td></tr>`;
            }
        });
    } catch (error) {
        console.error('Erro ao inicializar seção de produtos:', error);
    }
}

/**
 * Carrega e renderiza os produtos
 */
async function loadProducts() {
    console.log('Carregando produtos...');
    const tableBody = document.querySelector('#products-table tbody');
    
    if (!tableBody) {
        console.error('Elemento #products-table tbody não encontrado');
        return;
    }
    
    try {
        // Primeiro mostra uma mensagem de carregamento
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Carregando produtos...
                </td>
            </tr>
        `;
        
        // Carrega os produtos (com tentativas de retry incorporadas na API)
        await productManager.loadProducts(false);
        
        // Renderiza os produtos
        const products = productManager.getAllProducts();
        
        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">Nenhum produto encontrado</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            
            // Obtém o caminho da categoria
            const categoryPath = product.categoryPath || 'Sem categoria';
            
            // Formata o preço
            const price = formatPrice(product.price);
            
            // Monta a URL da imagem
            const imageUrl = product.imageUrl || product.image || 'img/placeholder.jpg';
            
            row.innerHTML = `
                <td>${product.id}</td>
                <td>
                    <img src="${imageUrl}" alt="${product.name}" class="product-thumbnail">
                </td>
                <td>${product.name}</td>
                <td>${categoryPath}</td>
                <td>${price}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="edit-btn" onclick="openProductModal(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="confirmDeleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        console.log('Produtos carregados com sucesso');
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="error-message">
                    Erro ao carregar produtos: ${error.message}
                </td>
            </tr>
        `;
    }
}

/**
 * Inicializa a seção de categorias
 */
async function initCategoriesSection() {
    console.log('Inicializando seção de categorias...');
    const mainContent = document.getElementById('main-content');
    
    // Cria o HTML da seção
    mainContent.innerHTML = `
        <div class="section-header">
            <button class="add-button" onclick="addCategory()">
                <i class="fas fa-plus"></i> Nova Categoria
            </button>
        </div>
        <div class="categories-container">
            <div id="categories-tree" class="loading">
                <p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Carregando categorias...</p>
            </div>
        </div>
    `;
    
    try {
        // Renderiza a árvore de categorias de forma assíncrona
        renderCategoriesTree().catch(error => {
            console.error('Erro ao renderizar árvore de categorias:', error);
            const categoriesTree = document.getElementById('categories-tree');
            if (categoriesTree) {
                categoriesTree.classList.remove('loading');
                categoriesTree.innerHTML = `<p class="error-message">Erro ao carregar categorias: ${error.message}</p>`;
            }
        });
    } catch (error) {
        console.error('Erro ao inicializar seção de categorias:', error);
    }
}

/**
 * Renderiza a árvore de categorias
 */
async function renderCategoriesTree() {
    console.log('Renderizando árvore de categorias...');
    const container = document.getElementById('categories-tree');
    
    if (!container) {
        console.error('Elemento #categories-tree não encontrado');
        return;
    }
    
    try {
        // Certifica-se de que as categorias estão carregadas
        await categoryManager.loadCategories(false);
        
        // Obtém a hierarquia de categorias
        const hierarchy = categoryManager.getCategoryHierarchy();
        console.log('Hierarquia de categorias:', hierarchy);
        
        // Remove a classe de carregamento
        container.classList.remove('loading');
        
        // Limpa o container
        container.innerHTML = '';
        
        if (!hierarchy || hierarchy.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhuma categoria encontrada.</p>';
            return;
        }
        
        // Renderiza cada categoria principal
        hierarchy.forEach(category => {
            container.appendChild(createCategoryNode(category));
        });
        
        console.log('Árvore de categorias renderizada com sucesso');
    } catch (error) {
        console.error('Erro ao renderizar categorias:', error);
        container.classList.remove('loading');
        container.innerHTML = `<p class="error-message">Erro ao carregar categorias: ${error.message}</p>`;
    }
}

/**
 * Cria um nó da árvore de categorias
 */
function createCategoryNode(category, level = 0) {
    const node = document.createElement('div');
    node.className = 'category-node';
    node.dataset.id = category.id;
    node.dataset.level = level;
    
    // Adiciona indentação para subcategorias
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level);
    
    node.innerHTML = `
        <div class="category-content">
            <span class="category-name">${indent}${category.name}</span>
            <div class="category-actions">
                <button class="add-subcategory-btn" onclick="addSubcategory('${category.id}')">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="edit-btn" onclick="editCategory('${category.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="confirmDeleteCategory('${category.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Adiciona subcategorias recursivamente
    if (category.subcategories && category.subcategories.length > 0) {
        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.className = 'subcategories';
        
        category.subcategories.forEach(subcategory => {
            subcategoriesContainer.appendChild(createCategoryNode(subcategory, level + 1));
        });
        
        node.appendChild(subcategoriesContainer);
    }
    
    return node;
}

/**
 * Adiciona uma nova categoria
 */
async function addCategory() {
    // Abre um modal para adicionar categoria
    const mainContent = document.getElementById('main-content');
    
    // Cria o modal se não existir
    let modalElement = document.getElementById('category-modal');
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'category-modal';
        modalElement.className = 'modal';
        
        // Cria o conteúdo do modal
        modalElement.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Nova Categoria</h2>
                    <span class="close" onclick="document.getElementById('category-modal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="category-form">
                        <div class="form-group">
                            <label for="newCategoryName">Nome da Categoria</label>
                            <input type="text" id="newCategoryName" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="newCategoryParent">Categoria Pai</label>
                            <select id="newCategoryParent" name="parentId">
                                <option value="null">Nenhuma (Categoria Principal)</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="saveCategory()" class="save-btn">Salvar</button>
                            <button type="button" class="cancel-btn" onclick="document.getElementById('category-modal').style.display='none'">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Adiciona o modal ao corpo do documento
        document.body.appendChild(modalElement);
    }
    
    // Preenche o select de categorias pai
    const parentSelect = document.getElementById('newCategoryParent');
    if (parentSelect) {
        // Limpa opções anteriores
        while (parentSelect.options.length > 1) {
            parentSelect.remove(1);
        }
        
        // Obtém todas as categorias
        const categories = categoryManager.getAllCategories();
        
        // Adiciona as categorias como opções
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            parentSelect.appendChild(option);
        });
    }
    
    // Exibe o modal
    modalElement.style.display = 'block';
}

/**
 * Salva uma nova categoria
 */
async function saveCategory() {
    // Obtém os valores do formulário
    const categoryName = document.getElementById('newCategoryName').value.trim();
    const parentSelect = document.getElementById('newCategoryParent');
    const parentId = parentSelect.value !== "null" ? parentSelect.value : null;
    
    // Verifica se o nome foi fornecido
    if (!categoryName) {
        showNotification('Por favor, forneça um nome para a categoria', 'error');
        return;
    }
    
    try {
        // Cria o objeto da categoria
        const category = {
            name: categoryName,
            parentId: parentId
        };
        
        // Adiciona a categoria
        await categoryManager.addCategory(category);
        
        // Fecha o modal
        document.getElementById('category-modal').style.display = 'none';
        
        // Atualiza a árvore de categorias
        await renderCategoriesTree();
        
        // Atualiza o select de categorias na seção de produtos
        updateCategoryFilter();
        
        // Mostra notificação de sucesso
        showNotification('Categoria adicionada com sucesso');
    } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
        showNotification('Erro ao adicionar categoria', 'error');
    }
}

/**
 * Edita uma categoria existente
 */
function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

/**
 * Abre o modal de categoria
 */
function openCategoryModal(categoryId = null, parentId = null) {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    const titleElement = modal.querySelector('.modal-title');
    
    // Limpa o formulário
    form.reset();
    
    // Configura o ID da categoria
    form.dataset.categoryId = categoryId || '';
    form.dataset.parentId = parentId || '';
    
    // Atualiza o título do modal
    if (categoryId) {
        titleElement.textContent = 'Editar Categoria';
        const category = categoryManager.getCategoryById(categoryId);
        if (category) {
            form.elements.name.value = category.name;
        }
    } else {
        titleElement.textContent = parentId ? 'Nova Subcategoria' : 'Nova Categoria';
    }
    
    // Exibe o modal
    modal.style.display = 'block';
}

/**
 * Salva uma categoria
 */
async function saveCategory(event) {
    event.preventDefault();
    
    const form = event.target;
    const categoryId = form.dataset.categoryId;
    const parentId = form.dataset.parentId;
    const name = form.elements.name.value.trim();
    
    if (!name) {
        showNotification('Nome da categoria é obrigatório', 'error');
        return;
    }
    
    try {
        if (categoryId) {
            // Atualiza categoria existente
            categoryManager.updateCategory(categoryId, name);
            showNotification('Categoria atualizada com sucesso');
        } else {
            // Adiciona nova categoria
            categoryManager.addCategory(name, parentId || null);
            showNotification('Categoria criada com sucesso');
        }
        
        // Fecha o modal
        const modal = document.getElementById('category-modal');
        modal.style.display = 'none';
        
        // Atualiza a árvore de categorias
        await renderCategoriesTree();
        
        // Atualiza o select de categorias na seção de produtos
        updateCategoryFilter();
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        showNotification('Erro ao salvar categoria', 'error');
    }
}

/**
 * Confirma a exclusão de uma categoria
 */
function confirmDeleteCategory(categoryId) {
    const category = categoryManager.getCategoryById(categoryId);
    if (!category) return;
    
    const hasSubcategories = categoryManager.hasSubcategories(categoryId);
    let message = `Deseja excluir a categoria "${category.name}"?`;
    
    if (hasSubcategories) {
        message += '\nTodas as subcategorias também serão excluídas.';
    }
    
    openConfirmModal(message, () => deleteCategory(categoryId));
}

/**
 * Exclui uma categoria
 */
async function deleteCategory(categoryId) {
    try {
        categoryManager.deleteCategory(categoryId, true);
        showNotification('Categoria excluída com sucesso');
        
        // Atualiza a árvore de categorias
        await renderCategoriesTree();
        
        // Atualiza o select de categorias na seção de produtos
        updateCategoryFilter();
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showNotification('Erro ao excluir categoria', 'error');
    }
}

/**
 * Atualiza o filtro de categorias na seção de produtos
 */
function updateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;
    
    // Limpa as opções atuais
    select.innerHTML = '<option value="">Todas as categorias</option>';
    
    // Obtém todas as categorias em formato plano
    const categories = categoryManager.getFlatCategories();
    
    // Adiciona as opções
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.path;
        select.appendChild(option);
    });
    
    // Adiciona evento de mudança
    select.onchange = filterProducts;
}

/**
 * Filtra os produtos por categoria e termo de busca
 */
function filterProducts() {
    const searchInput = document.getElementById('product-search');
    const categorySelect = document.getElementById('category-filter');
    const tableBody = document.querySelector('#products-table tbody');
    
    if (!tableBody) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryId = categorySelect.value;
    
    // Obtém todos os produtos
    let products = productManager.getAllProducts();
    
    // Filtra por categoria
    if (categoryId) {
        products = productManager.getProductsByCategory(categoryId, true);
    }
    
    // Filtra por termo de busca
    if (searchTerm) {
        products = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Atualiza a tabela
    tableBody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Obtém o caminho da categoria
        const categoryPath = product.categoryPath || productManager.getCategoryPathById(product.categoryId) || 'Sem categoria';
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <img src="${product.imageUrl || product.image}" alt="${product.name}" class="product-thumbnail">
            </td>
            <td>${product.name}</td>
            <td>${categoryPath}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="edit-btn" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="confirmDeleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Inicializa a busca de produtos
 */
function initProductSearch() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', filterProducts);
}

/**
 * Abre o modal para criar ou editar um produto
 * @param {number} productId - ID do produto para edição (opcional)
 */
function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const titleElement = document.querySelector('#product-modal .modal-header h2');
    const imagePreview = document.getElementById('product-image-preview');
    
    // Configura o formulário
    form.reset();
    form.dataset.productId = productId || '';
    
    // Limpa a visualização de imagem
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    
    // Carrega as categorias no select
    const categorySelect = document.getElementById('product-category');
    
    // Limpa as opções atuais exceto a primeira (default)
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }
    
    // Adiciona as categorias
    const categories = categoryManager.getFlatCategories();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.path || category.name;
        categorySelect.appendChild(option);
    });
    
    // Se tem ID, está editando
    if (productId) {
        // Modo de edição
        titleElement.textContent = 'Editar Produto';
        
        // Carrega os dados do produto
        const product = productManager.getProductById(productId);
        
        if (product) {
            form.elements.name.value = product.name;
            form.elements.description.value = product.description || '';
            form.elements.price.value = product.price;
            form.elements.stock.value = product.stock;
            form.elements.category.value = product.categoryId || 'null';
            form.elements.isNew.checked = product.isNew || false;
            form.elements.sale.checked = product.sale || false;
            form.elements.salePrice.value = product.salePrice || '';
            
            if (product.image) {
                imagePreview.src = product.imageUrl || product.image;
                imagePreview.style.display = 'block';
            }
        }
    } else {
        // Modo de criação
        titleElement.textContent = 'Novo Produto';
        imagePreview.style.display = 'none';
    }
    
    // Exibe o modal
    modal.style.display = 'block';
}

/**
 * Salva um produto (novo ou existente)
 * @param {Event} e - Evento de submit do formulário
 */
async function saveProduct(e) {
    e.preventDefault();
    
    try {
        const form = e.target;
        const formData = new FormData(form);
        
        // Obtém o ID do produto (se estiver editando)
        const productId = form.dataset.productId;
        
        // Valida os campos obrigatórios
        const name = formData.get('name').trim();
        if (!name) {
            showNotification('Nome do produto é obrigatório', 'error');
            return;
        }
        
        // Converte valores para números
        const price = parseFloat(formData.get('price'));
        if (isNaN(price) || price <= 0) {
            showNotification('Preço do produto deve ser um número positivo', 'error');
            return;
        }
        
        const stock = parseInt(formData.get('stock'));
        if (isNaN(stock) || stock < 0) {
            showNotification('Estoque deve ser um número não negativo', 'error');
            return;
        }
        
        // Obtém a categoria selecionada
        const categoryId = formData.get('category') !== 'null' ? formData.get('category') : null;
        
        // Cria o objeto do produto
        const productData = {
            name: name,
            description: formData.get('description').trim(),
            price,
            stock,
            categoryId: categoryId || null,
            isNew: formData.get('isNew') === 'on',
            sale: formData.get('sale') === 'on',
            salePrice: parseFloat(formData.get('salePrice')) || null
        };
        
        // Obtém a imagem
        const imageFile = form.elements.image.files[0];
        let imagePath = null;
        
        if (imageFile) {
            try {
                console.log('Iniciando upload de imagem:', imageFile.name);
                imagePath = await window.api.uploadImage(imageFile);
                console.log('Upload de imagem concluído com sucesso:', imagePath);
                productData.image = imagePath;
            } catch (uploadError) {
                console.error('Erro ao fazer upload de imagem:', uploadError);
                showNotification('Erro ao enviar a imagem. O produto será salvo sem imagem.', 'warning');
                
                // Se está apenas editando e já temos uma imagem, mantém a anterior
                if (productId) {
                    const existingProduct = productManager.getProductById(parseInt(productId));
                    if (existingProduct && existingProduct.image) {
                        productData.image = existingProduct.image;
                    }
                }
            }
        } else if (productId) {
            // Se estamos editando e não foi enviada nova imagem, mantém a imagem atual
            const existingProduct = productManager.getProductById(parseInt(productId));
            if (existingProduct && existingProduct.image) {
                productData.image = existingProduct.image;
            }
        }
        
        console.log('Dados do produto a salvar:', productData);
        
        if (productId) {
            // Atualiza o ID para o produto existente
            productData.id = parseInt(productId);
            
            console.log('Atualizando produto existente:', productData.id);
            // Atualiza produto existente via API
            await window.api.updateProduct(productData);
            showNotification('Produto atualizado com sucesso');
        } else {
            console.log('Adicionando novo produto');
            // Adiciona novo produto via API
            await window.api.addProduct(productData);
            showNotification('Produto criado com sucesso');
        }
        
        // Recarrega os produtos
        await productManager.loadProducts();
        
        // Fecha o modal
        const modal = document.getElementById('product-modal');
        modal.style.display = 'none';
        
        // Atualiza a tabela
        await loadProducts();
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showNotification(`Erro ao salvar produto: ${error.message}`, 'error');
    }
}

/**
 * Confirma a exclusão de um produto
 */
function confirmDeleteProduct(productId) {
    const product = productManager.getProductById(productId);
    if (!product) return;
    
    openConfirmModal(
        `Deseja excluir o produto "${product.name}"?`,
        () => deleteProduct(productId)
    );
}

/**
 * Exclui um produto
 */
async function deleteProduct(productId) {
    try {
        // Exclui o produto através da API
        await window.api.deleteProduct(productId);
        
        // Recarrega os produtos
        await productManager.loadProducts();
        
        // Atualiza a tabela
        await loadProducts();
        
        showNotification('Produto excluído com sucesso');
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showNotification('Erro ao excluir produto', 'error');
    }
}

/**
 * Inicializa o upload de imagens
 */
function initImageUpload() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept="image/*"]');
    
    imageInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const preview = document.getElementById(`${input.id}-preview`);
            if (preview) {
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            }
        });
    });
}

/**
 * Processa o upload de uma imagem
 */
async function handleImageUpload(file) {
    try {
        // Usar a API para fazer upload da imagem para o servidor
        const imagePath = await window.api.uploadImage(file);
        return imagePath;
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        showNotification('Erro ao enviar imagem', 'error');
        throw error;
    }
}

/**
 * Inicializa os modais
 */
function initModals() {
    // Configura o fechamento dos modais
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // Fecha ao clicar fora do modal
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    });
    
    // Configura os formulários
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.onsubmit = saveCategory;
    }
    
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.onsubmit = saveProduct;
    }
    
    const carouselForm = document.getElementById('carousel-form');
    if (carouselForm) {
        carouselForm.onsubmit = saveCarouselItem;
    }
}

/**
 * Abre o modal de confirmação
 */
function openConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const messageElement = modal.querySelector('.confirm-message');
    const confirmButton = modal.querySelector('.confirm-button');
    
    messageElement.textContent = message;
    
    confirmButton.onclick = () => {
        onConfirm();
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
}

/**
 * Exibe uma notificação
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * Formata um preço para exibição
 */
function formatPrice(price) {
    return price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

/**
 * Inicializa a seção do carrossel
 */
async function initCarouselSection() {
    const mainContent = document.getElementById('main-content');
    
    // Cria o HTML da seção com mensagem de carregamento
    mainContent.innerHTML = `
        <div class="section-header">
            <button class="add-button" onclick="openCarouselModal()">
                <i class="fas fa-plus"></i> Nova Imagem
            </button>
        </div>
        <div class="carousel-items-container">
            <div id="carousel-items">
                <p class="loading-message">Carregando itens do carrossel...</p>
            </div>
        </div>
    `;
    
    try {
        await loadCarouselItems();
        const items = JSON.parse(localStorage.getItem('carousel') || '[]');
        
        if (items.length === 0) {
            document.getElementById('carousel-items').innerHTML = 
                '<p class="empty-message">Nenhum item no carrossel. Clique em "Nova Imagem" para adicionar.</p>';
        }
    } catch (error) {
        console.error('Erro ao inicializar carrossel:', error);
        showNotification('Erro ao carregar o carrossel', 'error');
    }
}

/**
 * Carrega os itens do carrossel
 */
async function loadCarouselItems() {
    const container = document.getElementById('carousel-items');
    if (!container) return;
    
    try {
        // Mostrar indicador de carregamento
        container.innerHTML = '<p class="loading-message">Carregando itens do carrossel...</p>';
        
        // Obter slides da API
        let slidesData = await window.api.getCarouselSlides();
        
        // Garantir que slidesData é um array
        slidesData = Array.isArray(slidesData) ? slidesData : [];
        
        // Ordenar slides por ordem apenas se for um array
        if (Array.isArray(slidesData) && slidesData.length > 0) {
            slidesData.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        
        // Verificar se há slides
        if (!slidesData || slidesData.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum item no carrossel. Clique em "Nova Imagem" para adicionar.</p>';
            return;
        }
        
        // Limpar container
        container.innerHTML = '';
        
        // Renderizar cada slide
        slidesData.forEach((slide, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'carousel-item-card';
            
            // Tratar o caminho da imagem
            let imageUrl = slide.image;
            
            // Substituir referências de via.placeholder.com para placehold.co
            if (imageUrl && imageUrl.includes('via.placeholder.com')) {
                imageUrl = imageUrl.replace('via.placeholder.com', 'placehold.co');
            }
            
            // Garantir que o caminho da imagem seja absoluto
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            
            itemElement.innerHTML = `
                <div class="carousel-item-preview">
                    <img src="${imageUrl}" alt="${slide.title}" class="carousel-thumbnail" onerror="this.src='https://placehold.co/600x400/cccccc/969696?text=Imagem+não+encontrada'">
                    <div class="carousel-item-overlay">
                        <h3>${slide.title || 'Sem título'}</h3>
                        <p>${slide.subtitle || ''}</p>
                    </div>
                </div>
                <div class="carousel-item-actions">
                    <button class="move-btn" onclick="moveCarouselItem(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="move-btn" onclick="moveCarouselItem(${index}, 1)" ${index === slidesData.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="edit-btn" onclick="openCarouselModal(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="confirmDeleteCarouselItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(itemElement);
        });
    } catch (error) {
        console.error('Erro ao carregar itens do carrossel:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar itens do carrossel. Tente novamente mais tarde.</p>';
    }
}

/**
 * Abre o modal de item do carrossel
 */
function openCarouselModal(index = null) {
    const modal = document.getElementById('carousel-modal');
    const form = document.getElementById('carousel-form');
    const titleElement = modal.querySelector('.modal-title');
    
    if (!modal || !form || !titleElement) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    // Reset form
    form.reset();
    
    let slide = null;
    
    if (index !== null) {
        // Edit existing item
        titleElement.textContent = 'Editar Item do Carrossel';
        
        const slides = JSON.parse(localStorage.getItem('carouselSlides') || '[]');
        const items = JSON.parse(localStorage.getItem('carousel') || '[]');
        
        if (index >= 0 && index < items.length) {
            const item = items[index];
            
            if (item.slideId) {
                slide = slides.find(s => s.id === item.slideId);
            }
            
            if (slide) {
                // Usar hidden inputs para armazenar valores
                const indexInput = document.createElement('input');
                indexInput.type = 'hidden';
                indexInput.id = 'carousel-index';
                indexInput.name = 'index';
                indexInput.value = index;
                
                const slideIdInput = document.createElement('input');
                slideIdInput.type = 'hidden';
                slideIdInput.id = 'carousel-slide-id';
                slideIdInput.name = 'slideId';
                slideIdInput.value = slide.id;
                
                // Adicionar inputs ao formulário
                form.appendChild(indexInput);
                form.appendChild(slideIdInput);
                
                // Preencher campos visíveis
                document.getElementById('carousel-title').value = item.title || slide.title || '';
                document.getElementById('carousel-description').value = item.description || slide.subtitle || '';
                document.getElementById('carousel-link').value = item.link || slide.buttonLink || '';
                
                // Modificar imageUrl para usar placehold.co em vez de via.placeholder.com
                let imageUrl = slide.image;
                if (imageUrl && imageUrl.includes('via.placeholder.com')) {
                    imageUrl = imageUrl.replace('via.placeholder.com', 'placehold.co');
                }
                
                const previewImage = document.getElementById('carousel-image-preview');
                if (previewImage) {
                    previewImage.src = imageUrl;
                    previewImage.style.display = 'block';
                }
            }
        }
    } else {
        // Add new item
        titleElement.textContent = 'Adicionar Item ao Carrossel';
        
        // Limpar inputs ocultos caso existam
        const oldIndex = document.getElementById('carousel-index');
        const oldSlideId = document.getElementById('carousel-slide-id');
        if (oldIndex) oldIndex.remove();
        if (oldSlideId) oldSlideId.remove();
        
        // Default image preview with placehold.co
        const defaultImageUrl = 'https://placehold.co/1920x500/4a90e2/ffffff?text=Nova+Imagem';
        
        const previewImage = document.getElementById('carousel-image-preview');
        if (previewImage) {
            previewImage.src = defaultImageUrl;
            previewImage.style.display = 'block';
        }
    }
    
    // Show modal
    modal.style.display = 'block';
}

/**
 * Salva um item do carrossel
 */
async function saveCarouselItem(event) {
    event.preventDefault();
    
    const form = event.target;
    const title = document.getElementById('carousel-title').value.trim();
    const description = document.getElementById('carousel-description').value.trim();
    const linkUrl = document.getElementById('carousel-link').value.trim();
    const imageInput = document.getElementById('carousel-image');
    
    // Obter valores dos inputs ocultos, se existirem
    const indexInput = document.getElementById('carousel-index');
    const slideIdInput = document.getElementById('carousel-slide-id');
    const index = indexInput ? parseInt(indexInput.value) : null;
    const slideId = slideIdInput ? slideIdInput.value : Date.now().toString();
    
    // Validação básica
    if (!title) {
        showNotification('O título é obrigatório', 'error');
        return;
    }
    
    // Verificar se há uma imagem no modo de criação
    if (index === null && !imageInput.files.length) {
        showNotification('A imagem é obrigatória para novos itens', 'error');
        return;
    }
    
    try {
        console.log('Processando item do carrossel...');
        
        // Preparar dados do slide
        const slideData = {
            title: title,
            subtitle: description,
            buttonText: '',
            buttonLink: linkUrl,
            order: index !== null ? index + 1 : 99 // Ordem temporária
        };
        
        // Se tem id existente, incluir no objeto
        if (slideId) {
            slideData.id = slideId;
        }
        
        // Processar imagem se houver uma nova
        if (imageInput.files.length > 0) {
            try {
                console.log('Fazendo upload de nova imagem...');
                const imagePath = await window.api.uploadImage(imageInput.files[0]);
                slideData.image = imagePath;
                console.log('Upload de imagem concluído:', imagePath);
            } catch (error) {
                console.error('Erro ao fazer upload da imagem:', error);
                showNotification('Erro ao enviar imagem. Tente novamente.', 'error');
                return;
            }
        }
        
        // Salvar via API
        try {
            if (index !== null) {
                // Atualizar slide existente
                console.log('Atualizando slide existente:', slideData);
                await window.api.updateSlide(slideData);
            } else {
                // Adicionar novo slide
                console.log('Adicionando novo slide:', slideData);
                await window.api.addSlide(slideData);
            }
            
            // Fecha o modal
            const modal = document.getElementById('carousel-modal');
            modal.style.display = 'none';
            
            // Atualiza a lista
            await loadCarouselItems();
            
            showNotification(index !== null ? 'Item atualizado com sucesso' : 'Item adicionado com sucesso');
        } catch (error) {
            console.error('Erro ao salvar no servidor:', error);
            showNotification('Erro ao salvar no servidor', 'error');
        }
    } catch (error) {
        console.error('Erro ao processar item do carrossel:', error);
        showNotification('Erro ao processar item', 'error');
    }
}

/**
 * Exclui um item do carrossel
 */
async function deleteCarouselItem(index) {
    try {
        console.log(`Excluindo item do carrossel no índice ${index}...`);
        
        // Obtém os dados atuais
        const slides = await window.api.getCarouselSlides();
        
        // Verifica se o índice é válido
        if (index < 0 || index >= slides.length) {
            console.error(`Índice inválido: ${index}`);
            showNotification('Erro ao excluir item: índice inválido', 'error');
            return;
        }
        
        // Obtém o ID do slide a ser removido
        const slideId = slides[index].id;
        
        // Exclui o slide através da API
        await window.api.deleteSlide(slideId);
        console.log(`Slide ID ${slideId} removido com sucesso`);
        
        // Atualiza a lista
        await loadCarouselItems();
        
        showNotification('Item excluído com sucesso');
    } catch (error) {
        console.error('Erro ao excluir item do carrossel:', error);
        showNotification('Erro ao excluir item do carrossel', 'error');
    }
}

/**
 * Move um item do carrossel para cima ou para baixo
 */
async function moveCarouselItem(index, direction) {
    try {
        console.log(`Movendo item do carrossel no índice ${index} na direção ${direction}...`);
        
        // Obtém os dados atuais
        let items = JSON.parse(localStorage.getItem('carousel') || '[]');
        let slides = JSON.parse(localStorage.getItem('carouselSlides') || '[]');
        
        // Calcula o novo índice
        const newIndex = index + direction;
        
        // Verifica se o movimento é válido
        if (newIndex < 0 || newIndex >= items.length) {
            console.warn(`Movimento inválido: índice ${index} para ${newIndex}`);
            return;
        }
        
        console.log(`Trocando item ${index} com item ${newIndex}`);
        
        // Troca os itens de posição
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        
        // Atualiza a ordem dos slides correspondentes
        const item1 = items[index];
        const item2 = items[newIndex];
        
        if (item1.slideId && item2.slideId) {
            console.log(`Atualizando ordem dos slides: ${item1.slideId} e ${item2.slideId}`);
            
            const slide1Index = slides.findIndex(s => s.id === item1.slideId);
            const slide2Index = slides.findIndex(s => s.id === item2.slideId);
            
            if (slide1Index !== -1 && slide2Index !== -1) {
                // Troca as ordens dos slides
                const tempOrder = slides[slide1Index].order;
                slides[slide1Index].order = slides[slide2Index].order;
                slides[slide2Index].order = tempOrder;
                
                // Reordena todos os slides para garantir consistência
                slides.sort((a, b) => a.order - b.order);
                
                // Atualiza as ordens para garantir sequência contínua
                slides.forEach((slide, i) => {
                    slide.order = i + 1;
                });
                
                localStorage.setItem('carouselSlides', JSON.stringify(slides));
                console.log('Ordem dos slides atualizada com sucesso');
            } else {
                console.warn(`Um ou ambos os slides não foram encontrados: ${slide1Index}, ${slide2Index}`);
            }
        } else {
            console.warn('Um ou ambos os itens não têm slideId');
        }
        
        // Salva no localStorage
        localStorage.setItem('carousel', JSON.stringify(items));
        console.log('Itens do carrossel atualizados com sucesso');
        
        // Atualiza a lista
        await loadCarouselItems();
        
        showNotification('Item movido com sucesso');
    } catch (error) {
        console.error('Erro ao mover item do carrossel:', error);
        showNotification('Erro ao mover item do carrossel', 'error');
    }
}

/**
 * Confirma a exclusão de um item do carrossel
 */
function confirmDeleteCarouselItem(index) {
    const items = JSON.parse(localStorage.getItem('carousel') || '[]');
    const item = items[index];
    if (!item) return;
    
    openConfirmModal(
        `Deseja excluir o item "${item.title}" do carrossel?`,
        () => deleteCarouselItem(index)
    );
}

// Adicionar a função que faltava
async function initOrdersSection() {
    console.log("Seção de pedidos inicializada");
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="section-message">Funcionalidade de pedidos em desenvolvimento.</div>';
}

/**
 * Inicializa o painel de administração
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa os gerenciadores
    window.categoryManager = new CategoryManager();
    
    // Carrega as categorias iniciais
    await window.categoryManager.loadCategories();
    
    // Inicializa a interface
});

/**
 * Adiciona uma nova categoria
 */
async function addCategory() {
    // Abre um modal para adicionar categoria
    const mainContent = document.getElementById('main-content');
    
    // Cria o modal se não existir
    let modalElement = document.getElementById('category-modal');
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'category-modal';
        modalElement.className = 'modal';
        
        // Cria o conteúdo do modal
        modalElement.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Nova Categoria</h2>
                    <span class="close" onclick="document.getElementById('category-modal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="category-form">
                        <div class="form-group">
                            <label for="newCategoryName">Nome da Categoria</label>
                            <input type="text" id="newCategoryName" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="newCategoryParent">Categoria Pai</label>
                            <select id="newCategoryParent" name="parentId">
                                <option value="null">Nenhuma (Categoria Principal)</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="saveCategory()" class="save-btn">Salvar</button>
                            <button type="button" class="cancel-btn" onclick="document.getElementById('category-modal').style.display='none'">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Adiciona o modal ao corpo do documento
        document.body.appendChild(modalElement);
    }
    
    // Preenche o select de categorias pai
    const parentSelect = document.getElementById('newCategoryParent');
    if (parentSelect) {
        // Limpa opções anteriores
        while (parentSelect.options.length > 1) {
            parentSelect.remove(1);
        }
        
        // Obtém todas as categorias
        const categories = categoryManager.getAllCategories();
        
        // Adiciona as categorias como opções
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            parentSelect.appendChild(option);
        });
    }
    
    // Exibe o modal
    modalElement.style.display = 'block';
}

/**
 * Salva uma nova categoria
 */
async function saveCategory() {
    // Obtém os valores do formulário
    const categoryName = document.getElementById('newCategoryName').value.trim();
    const parentSelect = document.getElementById('newCategoryParent');
    const parentId = parentSelect.value !== "null" ? parentSelect.value : null;
    
    // Verifica se o nome foi fornecido
    if (!categoryName) {
        showNotification('Por favor, forneça um nome para a categoria', 'error');
        return;
    }
    
    try {
        // Cria o objeto da categoria
        const category = {
            name: categoryName,
            parentId: parentId
        };
        
        // Adiciona a categoria
        await categoryManager.addCategory(category);
        
        // Fecha o modal
        document.getElementById('category-modal').style.display = 'none';
        
        // Atualiza a árvore de categorias
        await renderCategoriesTree();
        
        // Atualiza o select de categorias na seção de produtos
        updateCategoryFilter();
        
        // Mostra notificação de sucesso
        showNotification('Categoria adicionada com sucesso');
    } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
        showNotification('Erro ao adicionar categoria', 'error');
    }
}

/**
 * Atualiza uma categoria existente
 */
async function updateCategory() {
    // Obtém os valores do formulário
    const categoryId = document.getElementById('editCategoryId').value;
    const categoryName = document.getElementById('editCategoryName').value.trim();
    const parentSelect = document.getElementById('editCategoryParent');
    const parentId = parentSelect.value !== "null" ? parentSelect.value : null;
    
    // Verifica se os dados foram fornecidos
    if (!categoryId || !categoryName) {
        showMessage('Erro ao atualizar categoria', 'ID ou nome da categoria não fornecido', 'error');
        return;
    }
    
    try {
        // Atualiza a categoria
        await window.categoryManager.updateCategory(categoryId, categoryName, parentId);
        
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
        
        showMessage('Sucesso', 'Categoria atualizada com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        showMessage('Erro ao atualizar categoria', error.message, 'error');
    }
}

/**
 * Remove uma categoria
 */
async function deleteCategory() {
    // Obtém o ID da categoria
    const categoryId = document.getElementById('deleteCategoryId').value;
    const updateSubcategories = document.getElementById('updateSubcategories').checked;
    const parentSelect = document.getElementById('newParentCategory');
    const newParentId = updateSubcategories && parentSelect.value !== "null" ? parentSelect.value : null;
    
    // Verifica se o ID foi fornecido
    if (!categoryId) {
        showMessage('Erro ao excluir categoria', 'ID da categoria não fornecido', 'error');
        return;
    }
    
    try {
        // Remove a categoria
        await window.categoryManager.deleteCategory(categoryId, updateSubcategories, newParentId);
        
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('deleteCategoryModal')).hide();
        
        showMessage('Sucesso', 'Categoria excluída com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showMessage('Erro ao excluir categoria', error.message, 'error');
    }
}

/**
 * Renderiza a tabela de categorias
 */
function renderCategoryTable() {
    const categoryTableBody = document.getElementById('categoryTableBody');
    if (!categoryTableBody) return;
    
    // Limpa a tabela
    categoryTableBody.innerHTML = '';
    
    if (!window.categoryManager || !Array.isArray(window.categoryManager.categories)) {
        console.warn('Nenhuma categoria disponível para renderizar');
        return;
    }
    
    // Obtém as categorias organizadas
    const categories = window.categoryManager.getFlatCategories();
    
    // Renderiza cada categoria
    categories.forEach(category => {
        const tr = document.createElement('tr');
        
        // Cria o nome com recuo para indicar hierarquia
        const nameCell = document.createElement('td');
        const namePrefix = category.level > 0 ? '&nbsp;'.repeat(category.level * 4) + '└─ ' : '';
        nameCell.innerHTML = namePrefix + category.name;
        
        // Cria as ações
        const actionsCell = document.createElement('td');
        actionsCell.className = 'text-end';
        
        // Botão de editar
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-sm btn-primary me-1';
        editButton.innerHTML = '<i class="bi bi-pencil"></i>';
        editButton.onclick = () => openEditCategoryModal(category.id);
        
        // Botão de excluir
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-sm btn-danger';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.onclick = () => openDeleteCategoryModal(category.id);
        
        // Adiciona os botões à célula de ações
        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        
        // Adiciona as células à linha
        tr.appendChild(nameCell);
        tr.appendChild(actionsCell);
        
        // Adiciona a linha à tabela
        categoryTableBody.appendChild(tr);
    });
}

/**
 * Atualiza todos os selects de categorias
 */
function updateCategorySelects() {
    // Atualiza os selects de categorias
    const selects = document.querySelectorAll('.category-select');
    
    if (!window.categoryManager || !Array.isArray(window.categoryManager.categories)) {
        console.warn('Nenhuma categoria disponível para os selects');
        return;
    }
    
    // Obtém as categorias organizadas para os selects
    const categories = window.categoryManager.getFlatCategories();
    
    // Atualiza cada select
    selects.forEach(select => {
        // Guarda o valor selecionado atual
        const currentValue = select.value;
        const excludeId = select.dataset.excludeId;
        
        // Limpa o select
        select.innerHTML = '';
        
        // Adiciona a opção "Nenhuma" (para categorias principais)
        const noneOption = document.createElement('option');
        noneOption.value = "null";
        noneOption.textContent = "Nenhuma (Categoria Principal)";
        select.appendChild(noneOption);
        
        // Adiciona as opções de categorias
        categories.forEach(category => {
            // Pula a categoria atual ao editar (para evitar categoria pai ser ela mesma)
            if (excludeId && category.id === excludeId) return;
            
            const option = document.createElement('option');
            option.value = category.id;
            
            // Adiciona recuo para indicar hierarquia
            const prefix = category.level > 0 ? '└─ '.repeat(category.level) : '';
            option.textContent = prefix + category.name;
            
            // Se for nova categoria pai no modal de exclusão, marca como selecionada
            if (select.id === 'newParentCategory' && currentValue === category.id) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        // Restaura o valor selecionado se possível
        if (currentValue && currentValue !== "null") {
            // Verifica se a opção ainda existe
            const optionExists = Array.from(select.options).some(opt => opt.value === currentValue);
            if (optionExists) {
                select.value = currentValue;
            }
        }
    });
}

/**
 * Abre o modal de edição de categoria
 * @param {string} categoryId - ID da categoria
 */
function openEditCategoryModal(categoryId) {
    if (!window.categoryManager) return;
    
    // Obtém a categoria
    const category = window.categoryManager.getCategoryById(categoryId);
    if (!category) {
        console.error(`Categoria com ID ${categoryId} não encontrada`);
        return;
    }
    
    // Preenche o formulário
    document.getElementById('editCategoryId').value = category.id;
    document.getElementById('editCategoryName').value = category.name;
    
    const parentSelect = document.getElementById('editCategoryParent');
    parentSelect.value = category.parentId || "null";
    parentSelect.dataset.excludeId = category.id; // Evita categoria pai ser ela mesma
    
    // Atualiza o select de categorias pais
    updateCategorySelects();
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    modal.show();
}

/**
 * Abre o modal de exclusão de categoria
 * @param {string} categoryId - ID da categoria
 */
function openDeleteCategoryModal(categoryId) {
    if (!window.categoryManager) return;
    
    // Obtém a categoria
    const category = window.categoryManager.getCategoryById(categoryId);
    if (!category) {
        console.error(`Categoria com ID ${categoryId} não encontrada`);
        return;
    }
    
    // Verifica se tem subcategorias
    const hasSubcategories = window.categoryManager.hasSubcategories(categoryId);
    
    // Preenche o formulário
    document.getElementById('deleteCategoryId').value = category.id;
    document.getElementById('deleteCategoryName').textContent = category.name;
    
    // Configura a seção de subcategorias
    const subcategoriesSection = document.getElementById('subcategoriesSection');
    subcategoriesSection.style.display = hasSubcategories ? 'block' : 'none';
    
    // Atualiza o select de novas categorias pais
    updateCategorySelects();
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('deleteCategoryModal'));
    modal.show();
}

/**
 * Configura os listeners de eventos para a seção de categorias
 */
function setupCategoryListeners() {
    // Formulário de adicionar categoria
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addCategory();
        });
    }
    
    // Formulário de editar categoria
    const editCategoryForm = document.getElementById('editCategoryForm');
    if (editCategoryForm) {
        editCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateCategory();
        });
    }
    
    // Formulário de excluir categoria
    const deleteCategoryForm = document.getElementById('deleteCategoryForm');
    if (deleteCategoryForm) {
        deleteCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            deleteCategory();
        });
    }
    
    // Checkbox para atualizar subcategorias
    const updateSubcategoriesCheckbox = document.getElementById('updateSubcategories');
    if (updateSubcategoriesCheckbox) {
        updateSubcategoriesCheckbox.addEventListener('change', function() {
            const newParentSection = document.getElementById('newParentSection');
            newParentSection.style.display = this.checked ? 'block' : 'none';
        });
    }
}

/**
 * Configura os listeners de eventos para o carrossel
 */
function setupCarouselListeners() {
    // Deixar para próxima fase
}

/**
 * Mostra uma mensagem para o usuário
 * @param {string} title - Título da mensagem
 * @param {string} message - Texto da mensagem
 * @param {string} type - Tipo de mensagem (success, error, info)
 */
function showMessage(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
    `;
    
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
        bsToast.show();
        
        // Remove o toast do DOM quando for fechado
        toast.addEventListener('hidden.bs.toast', function() {
            toastContainer.removeChild(toast);
        });
    }
} 