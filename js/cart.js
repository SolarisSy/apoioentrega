/**
 * Sistema de gerenciamento do carrinho de compras
 */

import Notifications from './notifications.js';

const Cart = {
    /**
     * Chave para armazenar os itens do carrinho no localStorage
     */
    STORAGE_KEY: 'cart',
    
    /**
     * Inicializa o carrinho
     */
    init() {
        console.log('Inicializando módulo de carrinho');
        
        // Migra dados da chave antiga, se existirem
        this.migrateCartData();
        
        // Garante que a estrutura do carrinho exista no localStorage
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
        
        // Atualiza o contador do carrinho
        this.updateCartCount();
        
        // Configura os event listeners
        this.setupEventListeners();
        
        console.log('Módulo de carrinho inicializado com sucesso');
    },
    
    /**
     * Migra dados da chave antiga para a nova
     */
    migrateCartData() {
        const oldCartData = localStorage.getItem('cart_items');
        if (oldCartData && !localStorage.getItem(this.STORAGE_KEY)) {
            console.log('Migrando dados do carrinho da chave antiga');
            localStorage.setItem(this.STORAGE_KEY, oldCartData);
            localStorage.removeItem('cart_items');
        }
    },
    
    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Botão do carrinho
        const cartBtn = document.getElementById('cart-button');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCartModal();
            });
        }
        
        // Botão de limpar carrinho
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
        
        // Botão de finalizar compra
        const checkoutBtn = document.getElementById('checkout-button');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                window.location.href = 'checkout.html';
            });
        }
        
        // Fechar modal
        const closeButtons = document.querySelectorAll('.modal .close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Fechar modal ao clicar fora
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    },
    
    /**
     * Abre o modal do carrinho
     */
    openCartModal() {
        console.log('Abrindo modal do carrinho');
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            // Atualiza os itens do carrinho
            this.renderCartItems();
            
            // Exibe o modal
            cartModal.style.display = 'block';
        } else {
            console.error('Modal do carrinho não encontrado no DOM');
        }
    },
    
    /**
     * Renderiza os itens do carrinho no modal
     */
    renderCartItems() {
        console.log('Renderizando itens do carrinho');
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalValue = document.getElementById('cart-total-price');
        
        if (!cartItemsContainer || !cartTotalValue) {
            console.error('Elementos do carrinho não encontrados no DOM');
            return;
        }
        
        const cartItems = this.getCartItems();
        console.log(`Itens no carrinho: ${cartItems.length}`);
        
        // Limpa o container
        cartItemsContainer.innerHTML = '';
        
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            cartTotalValue.textContent = 'R$ 0,00';
            
            // Desabilita o botão de checkout
            const checkoutButton = document.getElementById('checkout-button');
            if (checkoutButton) {
                checkoutButton.disabled = true;
                checkoutButton.classList.add('disabled');
            }
            return;
        }
        
        let html = '';
        let total = 0;
        
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            // Define o imageUrl
            let imageUrl = item.image || item.imageUrl;
            
            // Verifica se a URL da imagem é válida e completa
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            
            html += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${imageUrl || '/img/product-placeholder.jpg'}" 
                             alt="${item.name}" 
                             onerror="this.src='/img/product-placeholder.jpg'">
                    </div>
                    <div class="cart-item-details">
                        <h3>${item.name}</h3>
                        <p>Quantidade: ${item.quantity}</p>
                        <p>Preço: ${this.formatCurrency(item.price)}</p>
                        <p>Total: ${this.formatCurrency(itemTotal)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn-remove" data-id="${item.id}">Remover</button>
                    </div>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = html;
        cartTotalValue.textContent = this.formatCurrency(total);
        
        // Habilita o botão de checkout
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.disabled = false;
            checkoutButton.classList.remove('disabled');
        }
        
        // Adiciona event listeners aos botões de remover
        const removeButtons = cartItemsContainer.querySelectorAll('.btn-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.getAttribute('data-id');
                this.removeFromCart(itemId);
                this.renderCartItems();
            });
        });
    },
    
    /**
     * Obtém os itens do carrinho
     * @returns {Array} Lista de itens do carrinho
     */
    getCartItems() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (error) {
            console.error('Erro ao obter itens do carrinho:', error);
            return [];
        }
    },
    
    /**
     * Adiciona um item ao carrinho
     * @param {Object} product - Produto ou dados do produto a ser adicionado
     * @param {number} quantity - Quantidade a ser adicionada (opcional quando fornecida no objeto product)
     */
    addToCart(product, quantity) {
        console.log('Adicionando produto ao carrinho:', product);
        const cartItems = this.getCartItems();
        
        // O produto pode ser passado como um objeto completo ou apenas com ID e quantidade
        if (!product.name) {
            // Se estamos recebendo apenas ID e quantidade, precisamos obter o produto completo
            try {
                // Usado em modo assíncrono em main.js
                // Aqui buscamos os dados mínimos necessários do ProductManager
                const fullProduct = window.productManager.getProductById(product.id);
                
                if (!fullProduct) {
                    console.error(`Produto com ID ${product.id} não encontrado`);
                    Notifications.erro('Erro', 'Produto não encontrado');
                    return;
                }
                
                // Usamos os dados do produto obtido
                product = fullProduct;
                
                // Se a quantidade foi enviada no objeto product, usamos ela
                quantity = product.quantity || quantity || 1;
            } catch (error) {
                console.error('Erro ao obter detalhes do produto:', error);
                Notifications.erro('Erro', 'Não foi possível adicionar o produto ao carrinho');
                return;
            }
        }
        
        // Definição padrão da quantidade
        quantity = quantity || 1;
        
        // Verifica se o produto já está no carrinho
        const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
            // Atualiza a quantidade
            cartItems[existingItemIndex].quantity += quantity;
        } else {
            // Adiciona o novo item
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image || product.imageUrl,
                quantity: quantity
            });
        }
        
        // Salva no localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartItems));
        
        // Atualiza o contador do carrinho
        this.updateCartCount();
        
        // Exibe notificação
        Notifications.sucesso('Produto Adicionado', `${product.name} foi adicionado ao carrinho`);
    },
    
    /**
     * Remove um item do carrinho
     * @param {string} productId - ID do produto a ser removido
     */
    removeFromCart(productId) {
        console.log('Removendo produto do carrinho:', productId);
        const cartItems = this.getCartItems();
        const updatedItems = cartItems.filter(item => item.id !== productId);
        
        // Salva no localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedItems));
        
        // Atualiza o contador do carrinho
        this.updateCartCount();
        
        // Exibe notificação
        Notifications.aviso('Produto Removido', 'Item removido do carrinho');
    },
    
    /**
     * Atualiza a quantidade de um item no carrinho
     * @param {string} productId - ID do produto
     * @param {number} quantity - Nova quantidade
     */
    updateQuantity(productId, quantity) {
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return;
        }
        
        const cartItems = this.getCartItems();
        const itemIndex = cartItems.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            cartItems[itemIndex].quantity = quantity;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartItems));
            
            this.updateCartCount();
        }
    },
    
    /**
     * Limpa todos os itens do carrinho
     */
    clearCart() {
        console.log('Limpando carrinho');
        
        // Salva um array vazio no localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        
        // Atualiza o contador
        this.updateCartCount();
        
        // Renderiza o carrinho vazio
        this.renderCartItems();
        
        // Exibe notificação
        Notifications.aviso('Carrinho Limpo', 'Todos os itens foram removidos do carrinho');
    },
    
    /**
     * Atualiza o contador do carrinho na interface
     */
    updateCartCount() {
        const cartCountElement = document.getElementById('cart-count');
        if (!cartCountElement) return;
        
        const cartItems = this.getCartItems();
        const count = cartItems.reduce((total, item) => total + item.quantity, 0);
        
        cartCountElement.textContent = count;
    },
    
    /**
     * Formata um valor monetário
     * @param {number} value - Valor a ser formatado
     * @returns {string} Valor formatado em R$
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    },
    
    /**
     * Obtém o total atual do carrinho
     * @returns {number} Total do carrinho
     */
    getCartTotal() {
        const cartItems = this.getCartItems();
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    /**
     * Retorna os itens do carrinho para uso externo
     * @returns {Array} Itens do carrinho
     */
    getItems() {
        return this.getCartItems();
    }
};

// Inicializa o carrinho quando o módulo é carregado
document.addEventListener('DOMContentLoaded', () => {
    // Exporta o objeto Cart para o escopo global
    window.Cart = Cart;
});

// Exporta o módulo
export default Cart; 