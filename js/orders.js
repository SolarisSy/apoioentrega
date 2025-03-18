/**
 * Módulo de gerenciamento de pedidos
 */
class OrderManager {
    constructor() {
        this.ORDERS_STORAGE_KEY = 'orders_data';
        this.isInitialized = false;
        this.orders = [];
        this.currentOrder = null;
        this.lastOrderId = 0;
    }
    
    /**
     * Inicializa o gerenciador de pedidos
     */
    init() {
        if (this.isInitialized) {
            return;
        }
        
        // Carrega os pedidos do localStorage
        this.loadOrders();
        
        console.log('OrderManager inicializado com sucesso');
        this.isInitialized = true;
    }
    
    /**
     * Carrega os pedidos do localStorage
     */
    loadOrders() {
        const ordersData = localStorage.getItem(this.ORDERS_STORAGE_KEY);
        
        if (ordersData) {
            try {
                this.orders = JSON.parse(ordersData);
                console.log(`${this.orders.length} pedidos carregados`);
                
                // Encontra o último ID de pedido
                if (this.orders.length > 0) {
                    const maxId = Math.max(...this.orders.map(order => parseInt(order.id)));
                    this.lastOrderId = maxId;
                }
            } catch (error) {
                console.error('Erro ao carregar pedidos:', error);
                this.orders = [];
                localStorage.removeItem(this.ORDERS_STORAGE_KEY);
            }
        } else {
            this.orders = [];
        }
    }
    
    /**
     * Salva os pedidos no localStorage
     */
    saveOrders() {
        localStorage.setItem(this.ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
    }
    
    /**
     * Cria um novo pedido
     * @param {Object} orderData - Dados do pedido
     * @returns {Object} Pedido criado
     */
    createOrder(orderData) {
        // Incrementa o ID
        this.lastOrderId++;
        
        // Cria o novo pedido
        const order = {
            id: this.lastOrderId,
            date: new Date().toISOString(),
            status: 'pending', // pending, processing, completed, canceled
            ...orderData
        };
        
        // Adiciona o pedido à lista
        this.orders.push(order);
        
        // Salva os pedidos
        this.saveOrders();
        
        // Define como pedido atual
        this.currentOrder = order;
        
        console.log('Pedido criado:', order);
        
        return order;
    }
    
    /**
     * Atualiza um pedido existente
     * @param {number} orderId - ID do pedido
     * @param {Object} orderData - Novos dados do pedido
     * @returns {Object|null} Pedido atualizado ou null se não encontrado
     */
    updateOrder(orderId, orderData) {
        const index = this.orders.findIndex(order => order.id === orderId);
        
        if (index === -1) {
            console.error(`Pedido #${orderId} não encontrado`);
            return null;
        }
        
        // Atualiza o pedido
        const updatedOrder = {
            ...this.orders[index],
            ...orderData,
            updatedAt: new Date().toISOString()
        };
        
        // Substitui o pedido na lista
        this.orders[index] = updatedOrder;
        
        // Salva os pedidos
        this.saveOrders();
        
        console.log(`Pedido #${orderId} atualizado:`, updatedOrder);
        
        return updatedOrder;
    }
    
    /**
     * Obtém um pedido pelo ID
     * @param {number} orderId - ID do pedido
     * @returns {Object|null} Pedido encontrado ou null
     */
    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId) || null;
    }
    
    /**
     * Obtém todos os pedidos
     * @returns {Array} Lista de pedidos
     */
    getAllOrders() {
        return [...this.orders];
    }
    
    /**
     * Obtém os pedidos de um usuário
     * @param {string} userId - ID do usuário
     * @returns {Array} Lista de pedidos do usuário
     */
    getOrdersByUserId(userId) {
        return this.orders.filter(order => order.userId === userId);
    }
    
    /**
     * Cancela um pedido
     * @param {number} orderId - ID do pedido
     * @returns {Object|null} Pedido cancelado ou null
     */
    cancelOrder(orderId) {
        const order = this.getOrderById(orderId);
        
        if (!order) {
            console.error(`Pedido #${orderId} não encontrado`);
            return null;
        }
        
        // Atualiza o status para cancelado
        return this.updateOrder(orderId, { status: 'canceled' });
    }
    
    /**
     * Completa um pedido
     * @param {number} orderId - ID do pedido
     * @returns {Object|null} Pedido completado ou null
     */
    completeOrder(orderId) {
        const order = this.getOrderById(orderId);
        
        if (!order) {
            console.error(`Pedido #${orderId} não encontrado`);
            return null;
        }
        
        // Atualiza o status para completado
        return this.updateOrder(orderId, { status: 'completed' });
    }
    
    /**
     * Define o status de um pedido
     * @param {number} orderId - ID do pedido
     * @param {string} status - Novo status (pending, processing, completed, canceled)
     * @returns {Object|null} Pedido atualizado ou null
     */
    setOrderStatus(orderId, status) {
        const order = this.getOrderById(orderId);
        
        if (!order) {
            console.error(`Pedido #${orderId} não encontrado`);
            return null;
        }
        
        // Verifica se o status é válido
        const validStatus = ['pending', 'processing', 'completed', 'canceled'];
        if (!validStatus.includes(status)) {
            console.error(`Status inválido: ${status}`);
            return null;
        }
        
        // Atualiza o status
        return this.updateOrder(orderId, { status });
    }
    
    /**
     * Define o pedido atual
     * @param {number} orderId - ID do pedido
     * @returns {Object|null} Pedido definido como atual ou null
     */
    setCurrentOrder(orderId) {
        const order = this.getOrderById(orderId);
        
        if (!order) {
            console.error(`Pedido #${orderId} não encontrado`);
            return null;
        }
        
        this.currentOrder = order;
        return order;
    }
    
    /**
     * Obtém o pedido atual
     * @returns {Object|null} Pedido atual
     */
    getCurrentOrder() {
        return this.currentOrder;
    }
    
    /**
     * Limpa o pedido atual
     */
    clearCurrentOrder() {
        this.currentOrder = null;
    }
}

// Exporta o gerenciador de pedidos
const orderManager = new OrderManager();
export default orderManager; 