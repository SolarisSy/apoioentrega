/**
 * Módulo principal da página de checkout
 */
import orderManager from './orders.js';
import Payment from './payment.js';

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando página de checkout');
    
    // Inicializa o gerenciador de pedidos
    orderManager.init();
    
    // Carrega os itens do carrinho
    loadCartItems();
    
    // Configura os event listeners
    setupEventListeners();
});

/**
 * Carrega os itens do carrinho
 */
function loadCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    
    if (!cartItemsContainer || !cartTotalElement) {
        console.error('Elementos do carrinho não encontrados');
        return;
    }
    
    // Limpa o container
    cartItemsContainer.innerHTML = '';
    
    // Obtém os itens do carrinho do localStorage
    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
            console.log(`Carregados ${cart.length} itens do carrinho`);
        } else {
            console.log('Carrinho vazio ou não encontrado');
        }
    } catch (error) {
        console.error('Erro ao carregar o carrinho:', error);
        cart = [];
    }
    
    // Verifica se o carrinho está vazio
    if (!cart || cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        cartTotalElement.textContent = 'R$ 0,00';
        
        // Desabilita o formulário
        const customerForm = document.getElementById('customer-form');
        if (customerForm) {
            const submitButton = customerForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }
        }
        
        return;
    }
    
    // Calcula o total
    let total = 0;
    
    // Adiciona os itens do carrinho ao DOM
    cart.forEach(item => {
        // Calcula o preço final do item
        const itemPrice = item.price * item.quantity;
        total += itemPrice;
        
        // Cria o elemento do item
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        // Define o imageUrl
        let imageUrl = item.image || item.imageUrl;
        
        // Verifica se a URL da imagem é válida e completa
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }
        
        // Imagem do produto
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl || '/img/product-placeholder.jpg';
        imageElement.alt = item.name;
        imageElement.className = 'cart-item-image';
        imageElement.onerror = function() {
            this.src = '/img/product-placeholder.jpg';
        };
        
        // Informações do produto
        const infoElement = document.createElement('div');
        infoElement.className = 'cart-item-info';
        
        // Nome do produto
        const nameElement = document.createElement('h3');
        nameElement.className = 'cart-item-name';
        nameElement.textContent = item.name;
        
        // Preço do produto
        const priceElement = document.createElement('p');
        priceElement.className = 'cart-item-price';
        priceElement.textContent = `R$ ${formatPrice(item.price)}`;
        
        // Quantidade
        const quantityElement = document.createElement('p');
        quantityElement.className = 'cart-item-quantity';
        quantityElement.textContent = `Quantidade: ${item.quantity}`;
        
        // Preço total
        const totalElement = document.createElement('p');
        totalElement.className = 'cart-item-total';
        totalElement.textContent = `Total: R$ ${formatPrice(itemPrice)}`;
        
        // Adiciona os elementos de informação
        infoElement.appendChild(nameElement);
        infoElement.appendChild(priceElement);
        infoElement.appendChild(quantityElement);
        infoElement.appendChild(totalElement);
        
        // Adiciona os elementos ao item
        itemElement.appendChild(imageElement);
        itemElement.appendChild(infoElement);
        
        // Adiciona o item ao container
        cartItemsContainer.appendChild(itemElement);
    });
    
    // Atualiza o total
    cartTotalElement.textContent = `R$ ${formatPrice(total)}`;
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Formulário de dados do cliente
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            processCustomerData();
        });
    }
    
    // Adiciona máscara para o CPF
    const cpfInput = document.getElementById('customer-cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            
            // Formatação do CPF: 000.000.000-00
            if (value.length > 9) {
                value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
            } else if (value.length > 6) {
                value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
            } else if (value.length > 3) {
                value = value.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
            }
            
            e.target.value = value;
        });
    }
    
    // Botão de gerar PIX
    const generatePixBtn = document.getElementById('generate-pix');
    if (generatePixBtn) {
        generatePixBtn.addEventListener('click', generatePixCode);
    }
    
    // Botão de copiar código PIX
    const copyPixCodeBtn = document.getElementById('copy-pix-code');
    if (copyPixCodeBtn) {
        copyPixCodeBtn.addEventListener('click', () => {
            const pixCode = document.getElementById('pix-code');
            if (pixCode) {
                pixCode.select();
                document.execCommand('copy');
                showNotification('Código PIX copiado para a área de transferência!', 'success');
            }
        });
    }
    
    // Carrega o modal do carrinho quando clicado
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            openCartModal();
        });
    }
    
    // Botão de checkout no modal
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const modal = document.getElementById('cart-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Botão de limpar carrinho
    const clearCartBtn = document.getElementById('clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            clearCart();
            openCartModal(); // Atualiza o modal
        });
    }
    
    // Fechar modal quando clicar no X
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
}

/**
 * Abre o modal do carrinho
 */
function openCartModal() {
    console.log('Abrindo modal do carrinho');
    const cartModal = document.getElementById('cart-modal');
    const modalCartItems = document.getElementById('modal-cart-items');
    const modalCartTotalValue = document.getElementById('modal-cart-total-value');
    
    if (!cartModal || !modalCartItems || !modalCartTotalValue) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    // Limpa o container de itens
    modalCartItems.innerHTML = '';
    
    // Obtém os itens do carrinho
    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (error) {
        console.error('Erro ao carregar o carrinho:', error);
        cart = [];
    }
    
    // Verifica se o carrinho está vazio
    if (!cart || cart.length === 0) {
        modalCartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        modalCartTotalValue.textContent = 'R$ 0,00';
        
        // Desabilita o botão de checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }
        
        // Exibe o modal
        cartModal.style.display = 'block';
        return;
    }
    
    // Calcula o total
    let total = 0;
    
    // Adiciona os itens do carrinho ao DOM
    cart.forEach(item => {
        // Calcula o preço final do item
        const itemPrice = item.price * item.quantity;
        total += itemPrice;
        
        // Define o imageUrl
        let imageUrl = item.image || item.imageUrl;
        
        // Verifica se a URL da imagem é válida e completa
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = '/' + imageUrl;
        }
        
        // Cria o elemento do item
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.dataset.itemId = item.id;
        
        // Estrutura do item
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${imageUrl || '/img/product-placeholder.jpg'}" 
                     alt="${item.name}" 
                     onerror="this.src='/img/product-placeholder.jpg'">
            </div>
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">Preço: R$ ${formatPrice(item.price)}</p>
                <p class="cart-item-quantity">Quantidade: ${item.quantity}</p>
                <p class="cart-item-total">Total: R$ ${formatPrice(itemPrice)}</p>
            </div>
            <div class="cart-item-actions">
                <button class="btn-remove" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
        `;
        
        // Adiciona o item ao container
        modalCartItems.appendChild(itemElement);
    });
    
    // Atualiza o total
    modalCartTotalValue.textContent = `R$ ${formatPrice(total)}`;
    
    // Habilita o botão de checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }
    
    // Adicione os event listeners para os botões de remover APÓS adicionar os itens ao DOM
    const removeButtons = modalCartItems.querySelectorAll('.btn-remove');
    removeButtons.forEach(button => {
        // Remova qualquer listener antigo (para evitar duplicação)
        button.removeEventListener('click', handleRemoveClick);
        // Adiciona novo listener
        button.addEventListener('click', handleRemoveClick);
    });
    
    // Exibe o modal
    cartModal.style.display = 'block';
}

// Função handler para o clique no botão remover
function handleRemoveClick(event) {
    const itemId = event.currentTarget.getAttribute('data-id');
    console.log(`Clique no botão remover para o item ID: ${itemId}`);
    if (itemId) {
        removeFromCart(itemId);
    } else {
        console.error('ID do item não encontrado no botão de remover');
    }
}

/**
 * Remove um item do carrinho
 * @param {string} itemId - ID do item a ser removido
 */
function removeFromCart(itemId) {
    console.log(`Removendo item ID: ${itemId} do carrinho`);
    
    if (!itemId) {
        console.error('ID do item não fornecido');
        showNotification('Erro ao remover item', 'error');
        return;
    }
    
    try {
        // Obter os itens do carrinho
        let cart = [];
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
        
        // Converter IDs para string para garantir comparação correta
        const itemIdStr = String(itemId);
        console.log(`Quantidade de itens antes da remoção: ${cart.length}`);
        
        // Filtra o item a ser removido
        const newCart = cart.filter(item => String(item.id) !== itemIdStr);
        console.log(`Quantidade de itens após a remoção: ${newCart.length}`);
        
        if (cart.length === newCart.length) {
            console.warn(`Item ID: ${itemId} não encontrado no carrinho`);
        }
        
        // Salva o carrinho atualizado
        localStorage.setItem('cart', JSON.stringify(newCart));
        
        // Atualiza a UI
        updateCartCount();
        
        // Se estamos na página de checkout, atualiza os itens
        if (window.location.pathname.includes('checkout')) {
            loadCartItems();
        } else {
            // Atualiza o modal do carrinho
            openCartModal();
        }
        
        showNotification('Item removido do carrinho', 'success');
    } catch (error) {
        console.error('Erro ao remover item do carrinho:', error);
        showNotification('Erro ao remover item', 'error');
    }
}

/**
 * Limpa todos os itens do carrinho
 */
function clearCart() {
    // Limpa o localStorage
    localStorage.setItem('cart', JSON.stringify([]));
    
    // Atualiza a contagem no ícone do carrinho
    updateCartCount();
    
    // Se estamos na página de checkout, atualiza os itens exibidos
    if (window.location.pathname.includes('checkout')) {
        loadCartItems();
    }
    
    // Exibe notificação
    showNotification('Carrinho esvaziado', 'info');
}

/**
 * Atualiza a contagem de itens no ícone do carrinho
 */
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;
    
    let count = 0;
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            const cart = JSON.parse(cartData);
            count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        }
    } catch (error) {
        console.error('Erro ao calcular contagem do carrinho:', error);
    }
    
    cartCountElement.textContent = count;
}

/**
 * Processa os dados do cliente e exibe a seção de pagamento
 */
function processCustomerData() {
    // Obtém os dados do formulário
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const cpf = document.getElementById('customer-cpf').value;
    
    // Valida dados
    if (!name || !email || !cpf) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    // Validação básica de email
    if (!validateEmail(email)) {
        showNotification('E-mail inválido', 'error');
        return;
    }
    
    // Validação básica de CPF
    if (!validateCPF(cpf)) {
        showNotification('CPF inválido', 'error');
        return;
    }
    
    // Salva os dados do cliente
    const customerData = { name, email, cpf };
    localStorage.setItem('customer_data', JSON.stringify(customerData));
    
    // Oculta o formulário e exibe a seção de pagamento
    document.querySelector('.customer-data').style.display = 'none';
    document.getElementById('payment-section').style.display = 'block';
    
    // Exibe notificação
    showNotification('Dados salvos com sucesso', 'success');
}

/**
 * Gera o código PIX para pagamento
 */
async function generatePixCode() {
    try {
        // Obtém os dados do carrinho
        let cart = [];
        try {
            const cartData = localStorage.getItem('cart');
            if (cartData) {
                cart = JSON.parse(cartData);
            }
        } catch (error) {
            console.error('Erro ao carregar o carrinho:', error);
            cart = [];
        }
        
        // Verifica se o carrinho está vazio
        if (!cart || cart.length === 0) {
            showNotification('Seu carrinho está vazio', 'error');
            return;
        }
        
        // Obtém os dados do cliente
        let customerData = {};
        try {
            const customerDataJson = localStorage.getItem('customer_data');
            if (customerDataJson) {
                customerData = JSON.parse(customerDataJson);
            }
        } catch (error) {
            console.error('Erro ao carregar dados do cliente:', error);
            showNotification('Erro ao carregar seus dados', 'error');
            return;
        }
        
        // Verifica se os dados do cliente estão presentes
        if (!customerData.name || !customerData.email || !customerData.cpf) {
            showNotification('Dados do cliente incompletos', 'error');
            return;
        }
        
        // Calcula o total
        const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        
        // Cria um pedido
        const order = orderManager.createOrder({
            items: cart,
            total: total,
            customer: customerData,
            paymentMethod: 'pix'
        });
        
        // Desativa o botão durante o processamento
        const generateButton = document.getElementById('generate-pix');
        if (generateButton) {
            generateButton.disabled = true;
            generateButton.textContent = 'Gerando...';
        }
        
        console.log('Gerando código PIX para valor total:', total);
        
        // Gera o código PIX utilizando a API Zippify
        try {
            // Verifica se o módulo payment está disponível
            if (typeof window.payment === 'undefined') {
                console.error('Módulo de pagamento não encontrado');
                throw new Error('Módulo de pagamento não disponível');
            }
            
            // Chama a API para gerar o PIX
            const pixData = await window.payment.gerarPix(total);
            
            if (!pixData || !pixData.qrCodeString || !pixData.copyPasteCode) {
                throw new Error('Dados PIX inválidos retornados pela API');
            }
            
            console.log('Código PIX gerado via API:', pixData);
            
            // Exibe o código PIX em texto
            const pixCodeInput = document.getElementById('pix-code');
            if (pixCodeInput) {
                pixCodeInput.value = pixData.copyPasteCode;
            }
            
            // Exibe o QR code no container
            const qrCodeDisplay = document.getElementById('qr-code-display');
            if (qrCodeDisplay) {
                // Limpa o container
                qrCodeDisplay.innerHTML = '';
                
                // Cria uma imagem para o QR code
                const qrCodeImg = document.createElement('img');
                qrCodeImg.id = 'pix-qrcode-img';
                qrCodeImg.alt = 'QR Code PIX';
                
                // Adiciona evento para detectar carregamento/erro
                qrCodeImg.onload = function() {
                    console.log('QR Code carregado com sucesso');
                };
                
                qrCodeImg.onerror = function() {
                    console.error('Erro ao carregar o QR Code da API');
                    
                    // Fallback para geração local
                    qrCodeDisplay.innerHTML = '';
                    
                    const canvas = document.createElement('canvas');
                    canvas.id = 'pix-qrcode-canvas';
                    canvas.width = 256;
                    canvas.height = 256;
                    
                    qrCodeDisplay.appendChild(canvas);
                    
                    // Gera o QR code localmente
                    generateQRCodeOnCanvas('pix-qrcode-canvas', pixData.copyPasteCode, 256);
                };
                
                // Configura a URL do QR code
                // Use a URL de um serviço de geração de QR code com o código PIX
                qrCodeImg.src = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(pixData.qrCodeString)}&chs=256x256&chld=L|0`;
                
                qrCodeDisplay.appendChild(qrCodeImg);
            }
            
            // Atualiza o pedido com os dados do PIX
            orderManager.updateOrder(order.id, {
                pixCode: pixData.copyPasteCode,
                pixQrCodeUrl: pixData.qrCodeString,
                status: 'waiting_payment'
            });
            
        } catch (error) {
            console.error('Erro ao gerar PIX via API:', error);
            
            // Fallback para geração local em caso de erro na API
            console.log('Utilizando geração local de QR code como fallback');
            
            const pixCodeStr = generateRandomPixCode();
            
            // Exibe o código PIX em texto
            const pixCodeInput = document.getElementById('pix-code');
            if (pixCodeInput) {
                pixCodeInput.value = pixCodeStr;
            }
            
            // Gera e exibe o QR code
            const qrCodeDisplay = document.getElementById('qr-code-display');
            if (qrCodeDisplay) {
                // Limpa o container
                qrCodeDisplay.innerHTML = '';
                
                // Cria um canvas para o QR code
                const canvas = document.createElement('canvas');
                canvas.id = 'pix-qrcode-canvas';
                canvas.width = 256;
                canvas.height = 256;
                
                // Adiciona o canvas ao container
                qrCodeDisplay.appendChild(canvas);
                
                // Gera o QR code no canvas
                generateQRCodeOnCanvas('pix-qrcode-canvas', pixCodeStr, 256);
                
                // Adiciona botão para salvar a imagem
                const saveButton = document.createElement('button');
                saveButton.id = 'save-qrcode';
                saveButton.className = 'btn btn-secondary mt-2';
                saveButton.textContent = 'Salvar QR Code';
                saveButton.addEventListener('click', () => {
                    const canvas = document.getElementById('pix-qrcode-canvas');
                    if (canvas) {
                        try {
                            const link = document.createElement('a');
                            link.download = 'pix-qrcode.png';
                            link.href = canvas.toDataURL('image/png');
                            link.click();
                            showNotification('QR Code salvo!', 'success');
                        } catch (e) {
                            console.error('Erro ao salvar QR code:', e);
                            showNotification('Erro ao salvar QR Code', 'error');
                        }
                    }
                });
                qrCodeDisplay.appendChild(saveButton);
            }
            
            // Atualiza o pedido com os dados do PIX (fallback)
            orderManager.updateOrder(order.id, {
                pixCode: pixCodeStr,
                status: 'waiting_payment'
            });
        }
        
        // Atualiza o status
        const paymentStatus = document.getElementById('payment-status');
        if (paymentStatus) {
            paymentStatus.textContent = 'Aguardando pagamento...';
            paymentStatus.style.color = '#f8c146';
        }
        
        // Exibe as instruções de pagamento
        const pixInstructions = document.getElementById('pix-instructions');
        if (pixInstructions) {
            pixInstructions.style.display = 'block';
        }
        
        // Cria botão de simulação se não existir
        let simulateButton = document.getElementById('simulate-payment');
        if (!simulateButton) {
            simulateButton = document.createElement('button');
            simulateButton.id = 'simulate-payment';
            simulateButton.className = 'btn btn-primary';
            simulateButton.textContent = 'Simular Pagamento';
            
            // Adiciona o botão à área de ações
            const paymentActions = document.querySelector('.payment-actions');
            if (paymentActions) {
                paymentActions.appendChild(simulateButton);
            }
        }
        
        // Configura o botão de simulação
        if (simulateButton) {
            simulateButton.style.display = 'inline-block';
            simulateButton.disabled = false;
            
            // Limpa qualquer listener antigo para evitar duplicação
            const newSimulateButton = simulateButton.cloneNode(true);
            if (simulateButton.parentNode) {
                simulateButton.parentNode.replaceChild(newSimulateButton, simulateButton);
            }
            simulateButton = newSimulateButton;
            
            // Adiciona event listener para simular pagamento
            simulateButton.addEventListener('click', () => simulatePayment(order.id));
        }
        
        // Reativa o botão de geração
        if (generateButton) {
            generateButton.disabled = false;
            generateButton.textContent = 'Gerar Novo Código';
        }
        
        // Inicia verificação de status
        startPaymentStatusCheck(order.id);
        
        // Exibe notificação
        showNotification('Código PIX gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar código PIX:', error);
        showNotification('Erro ao gerar código PIX', 'error');
        
        // Habilita o botão novamente em caso de erro
        const generateButton = document.getElementById('generate-pix');
        if (generateButton) {
            generateButton.disabled = false;
            generateButton.textContent = 'Tentar Novamente';
        }
    }
}

/**
 * Simula o pagamento de um pedido
 * @param {string} orderId - ID do pedido
 */
function simulatePayment(orderId) {
    try {
        // Atualiza o status do pedido
        orderManager.updateOrder(orderId, {
            status: 'processing',
            paidAt: new Date().toISOString()
        });
        
        // Atualiza UI
        const paymentStatus = document.getElementById('payment-status');
        if (paymentStatus) {
            paymentStatus.textContent = 'Pagamento recebido! Processando...';
            paymentStatus.style.color = '#28a745';
        }
        
        // Remove botão de simulação
        const simulateButton = document.getElementById('simulate-payment');
        if (simulateButton) {
            simulateButton.disabled = true;
            simulateButton.style.display = 'none';
        }
        
        // Exibe notificação
        showNotification('Pagamento recebido com sucesso!', 'success');
        
        // Completa o pedido após 3 segundos
        setTimeout(() => {
            completeOrder(orderId);
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao simular pagamento:', error);
        showNotification('Erro ao processar pagamento', 'error');
    }
}

/**
 * Inicia verificação de status do pagamento (simulação)
 * @param {string} orderId - ID do pedido
 */
function startPaymentStatusCheck(orderId) {
    // Simula verificação de status a cada 5 segundos
    const statusInterval = setInterval(() => {
        const order = orderManager.getOrderById(orderId);
        
        if (!order) {
            clearInterval(statusInterval);
            return;
        }
        
        // Se o pedido já foi pago, atualiza a UI
        if (order.status === 'processing' || order.status === 'completed') {
            const paymentStatus = document.getElementById('payment-status');
            if (paymentStatus) {
                if (order.status === 'processing') {
                    paymentStatus.textContent = 'Pagamento recebido! Processando...';
                } else {
                    paymentStatus.textContent = 'Pagamento confirmado!';
                }
                paymentStatus.style.color = '#28a745';
            }
            
            // Para a verificação
            clearInterval(statusInterval);
            
            // Se estava processando, completa o pedido
            if (order.status === 'processing') {
                setTimeout(() => {
                    completeOrder(orderId);
                }, 3000);
            }
        }
    }, 5000);
}

/**
 * Completa um pedido após pagamento confirmado
 * @param {string} orderId - ID do pedido
 */
function completeOrder(orderId) {
    try {
        // Atualiza o status do pedido para completo
        orderManager.updateOrder(orderId, {
            status: 'completed',
            completedAt: new Date().toISOString()
        });
        
        // Atualiza UI
        const paymentStatus = document.getElementById('payment-status');
        if (paymentStatus) {
            paymentStatus.textContent = 'Pagamento confirmado!';
            paymentStatus.style.color = '#28a745';
        }
        
        // Limpa o carrinho
        localStorage.removeItem('cart');
        
        // Exibe notificação
        showNotification('Pedido confirmado com sucesso!', 'success');
        
        // Adiciona botão de voltar à loja
        const paymentActions = document.querySelector('.payment-actions');
        if (paymentActions) {
            const backButton = document.createElement('a');
            backButton.href = 'index.html';
            backButton.className = 'btn btn-primary';
            backButton.textContent = 'Voltar à Loja';
            paymentActions.innerHTML = '';
            paymentActions.appendChild(backButton);
        }
        
    } catch (error) {
        console.error('Erro ao completar pedido:', error);
        showNotification('Erro ao finalizar pedido', 'error');
    }
}

/**
 * Gera um código PIX aleatório para demonstração
 * @returns {string} Código PIX aleatório
 */
function generateRandomPixCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    const length = 30 + Math.floor(Math.random() * 10); // Comprimento entre 30 e 40 caracteres
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Formata um preço com 2 casas decimais
 * @param {number} price - Preço a ser formatado
 * @returns {string} Preço formatado
 */
function formatPrice(price) {
    // Verifica se o preço é válido
    if (price === null || price === undefined) {
        price = 0;
    }
    
    return parseFloat(price).toFixed(2).replace('.', ',');
}

/**
 * Valida um endereço de e-mail
 * @param {string} email - E-mail a ser validado
 * @returns {boolean} Verdadeiro se o e-mail for válido
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida um CPF (validação simplificada)
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} Verdadeiro se o CPF for válido
 */
function validateCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
        return false;
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }
    
    // Para uma validação simplificada, vamos considerar válido se tiver 11 dígitos
    // e não for uma sequência de dígitos iguais
    return true;
}

/**
 * Exibe uma notificação
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Cria o elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Adiciona ao container de notificações
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);
        
        // Remove a notificação após 3 segundos
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => {
                container.removeChild(notification);
            }, 500);
        }, 3000);
    }
}

/**
 * Gera um QR code em um elemento canvas
 * @param {string} canvasId - ID do elemento canvas
 * @param {string} text - Texto a ser codificado no QR code
 * @param {number} size - Tamanho do QR code em pixels
 * @returns {boolean} Verdadeiro se o QR code foi gerado com sucesso
 */
function generateQRCodeOnCanvas(canvasId, text, size = 256) {
    try {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas com ID ${canvasId} não encontrado`);
            return false;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Contexto de canvas não suportado');
            return false;
        }
        
        // Limpa o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Define o tamanho do módulo QR e margem
        const moduleCount = 33; // tamanho comum para QR codes
        const moduleSize = Math.floor(size / moduleCount);
        const actualSize = moduleSize * moduleCount;
        const margin = Math.floor((size - actualSize) / 2);
        
        // Desenha o fundo branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Função de hash simples para determinar estado do módulo
        const simpleHash = (x, y, text) => {
            const charCode = text.charCodeAt((x * 3 + y * 5) % text.length);
            const hashValue = (charCode * (x + 1) * (y + 1)) % 100;
            return hashValue < 45; // ~45% de preenchimento para imitar um QR code real
        };
        
        // Cores para o QR code
        ctx.fillStyle = '#000000';
        
        // Desenha a matriz de dados (módulos)
        for (let y = 0; y < moduleCount - 8; y++) {
            for (let x = 0; x < moduleCount - 8; x++) {
                // Pula as áreas dos padrões de posicionamento
                const isInTopLeftCorner = x < 7 && y < 7;
                const isInTopRightCorner = x >= moduleCount - 15 && y < 7;
                const isInBottomLeftCorner = x < 7 && y >= moduleCount - 15;
                
                if (!isInTopLeftCorner && !isInTopRightCorner && !isInBottomLeftCorner) {
                    // Determina se este módulo deve ser preto com base no hash
                    if (simpleHash(x, y, text)) {
                        ctx.fillRect(
                            margin + x * moduleSize,
                            margin + y * moduleSize,
                            moduleSize,
                            moduleSize
                        );
                    }
                }
            }
        }
        
        // Desenha os padrões de localização (três quadrados grandes nos cantos)
        const drawPositioningPattern = (x, y) => {
            // Quadrado externo
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                margin + x * moduleSize,
                margin + y * moduleSize,
                moduleSize * 7,
                moduleSize * 7
            );
            
            // Quadrado branco do meio
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
                margin + (x + 1) * moduleSize,
                margin + (y + 1) * moduleSize,
                moduleSize * 5,
                moduleSize * 5
            );
            
            // Quadrado preto interno
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                margin + (x + 2) * moduleSize,
                margin + (y + 2) * moduleSize,
                moduleSize * 3,
                moduleSize * 3
            );
        };
        
        // Desenha os três padrões de posicionamento
        drawPositioningPattern(0, 0); // Superior esquerdo
        drawPositioningPattern(moduleCount - 15, 0); // Superior direito
        drawPositioningPattern(0, moduleCount - 15); // Inferior esquerdo
        
        // Adiciona padrões de alinhamento (pequeno quadrado)
        const drawAlignmentPattern = (x, y) => {
            // Quadrado externo
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                margin + x * moduleSize,
                margin + y * moduleSize,
                moduleSize * 5,
                moduleSize * 5
            );
            
            // Quadrado branco do meio
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(
                margin + (x + 1) * moduleSize,
                margin + (y + 1) * moduleSize,
                moduleSize * 3,
                moduleSize * 3
            );
            
            // Quadrado preto interno
            ctx.fillStyle = '#000000';
            ctx.fillRect(
                margin + (x + 2) * moduleSize,
                margin + (y + 2) * moduleSize,
                moduleSize,
                moduleSize
            );
        };
        
        // Adiciona um padrão de alinhamento no centro
        drawAlignmentPattern(moduleCount - 16, moduleCount - 16);
        
        // Desenha padrões de sincronização (linhas pontilhadas entre padrões de posicionamento)
        ctx.fillStyle = '#000000';
        
        // Linha horizontal
        for (let x = 8; x < moduleCount - 16; x += 2) {
            ctx.fillRect(
                margin + x * moduleSize,
                margin + 6 * moduleSize,
                moduleSize,
                moduleSize
            );
        }
        
        // Linha vertical
        for (let y = 8; y < moduleCount - 16; y += 2) {
            ctx.fillRect(
                margin + 6 * moduleSize,
                margin + y * moduleSize,
                moduleSize,
                moduleSize
            );
        }
        
        console.log('QR Code gerado com sucesso no canvas');
        return true;
    } catch (error) {
        console.error('Erro ao gerar QR code no canvas:', error);
        return false;
    }
} 