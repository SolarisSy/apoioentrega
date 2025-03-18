/**
 * Sistema de notificações para a interface
 */

const Notifications = {
    /**
     * Exibe uma notificação de sucesso
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     */
    sucesso(title, message) {
        this.showNotification('success', title, message);
    },

    /**
     * Exibe uma notificação de erro
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     */
    erro(title, message) {
        this.showNotification('error', title, message);
    },

    /**
     * Exibe uma notificação de aviso
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     */
    aviso(title, message) {
        this.showNotification('info', title, message);
    },

    /**
     * Exibe uma notificação na interface
     * @param {string} type - Tipo da notificação (success, error, info)
     * @param {string} title - Título da notificação
     * @param {string} message - Mensagem da notificação
     */
    showNotification(type, title, message) {
        // Cria o elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Adiciona o conteúdo
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
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
};

// Exporta o módulo
export default Notifications; 