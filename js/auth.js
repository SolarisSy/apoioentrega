/**
 * Módulo de autenticação de usuários
 */
class AuthService {
    constructor() {
        this.STORAGE_KEY = 'user_data';
        this.isInitialized = false;
        this.currentUser = null;
    }
    
    /**
     * Inicializa o módulo de autenticação
     */
    init() {
        if (this.isInitialized) {
            return;
        }
        
        // Carrega o usuário atual do localStorage
        this.loadCurrentUser();
        
        // Inicializa os event listeners
        this.setupEventListeners();
        
        console.log('AuthService inicializado com sucesso');
        this.isInitialized = true;
    }
    
    /**
     * Configura os event listeners
     */
    setupEventListeners() {
        // Elementos do DOM
        const loginBtn = document.getElementById('login-btn');
        const userDropdown = document.getElementById('user-dropdown');
        const loginLink = document.getElementById('login-link');
        const registerLink = document.getElementById('register-link');
        const logoutLink = document.getElementById('logout-link');
        const loginModal = document.getElementById('login-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        const closeButton = loginModal?.querySelector('.close');
        
        // Verifica se os elementos existem
        if (!loginBtn || !userDropdown) {
            return;
        }
        
        // Toggle do dropdown de usuário
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.classList.toggle('show');
        });
        
        // Fecha o dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!loginBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('show');
            }
        });
        
        // Link de login
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openLoginModal('login-tab');
            });
        }
        
        // Link de cadastro
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openLoginModal('register-tab');
            });
        }
        
        // Link de logout
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Botão de fechar o modal
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                loginModal.style.display = 'none';
            });
        }
        
        // Fechar o modal ao clicar fora
        if (loginModal) {
            window.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.style.display = 'none';
                }
            });
        }
        
        // Alternar entre as abas
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                
                // Remove a classe active de todos os botões e conteúdos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Adiciona a classe active ao botão e conteúdo clicado
                button.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });
        
        // Formulário de login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                this.login(email, password);
            });
        }
        
        // Formulário de cadastro
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const phone = document.getElementById('register-phone').value;
                
                this.register(name, email, password, phone);
            });
        }
    }
    
    /**
     * Abre o modal de login
     * @param {string} tab - Aba a ser exibida (login-tab ou register-tab)
     */
    openLoginModal(tab = 'login-tab') {
        const loginModal = document.getElementById('login-modal');
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        if (!loginModal) {
            return;
        }
        
        // Exibe o modal
        loginModal.style.display = 'block';
        
        // Remove a classe active de todos os botões e conteúdos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adiciona a classe active à aba selecionada
        const selectedTabButton = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        const selectedTabContent = document.getElementById(tab);
        
        if (selectedTabButton && selectedTabContent) {
            selectedTabButton.classList.add('active');
            selectedTabContent.classList.add('active');
        }
    }
    
    /**
     * Carrega o usuário atual do localStorage
     */
    loadCurrentUser() {
        const userData = localStorage.getItem(this.STORAGE_KEY);
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('Usuário carregado:', this.currentUser.name);
                this.updateUI(true);
            } catch (error) {
                console.error('Erro ao carregar usuário:', error);
                this.currentUser = null;
                localStorage.removeItem(this.STORAGE_KEY);
                this.updateUI(false);
            }
        } else {
            this.updateUI(false);
        }
    }
    
    /**
     * Atualiza a interface com base no estado de autenticação
     * @param {boolean} isLoggedIn - Indica se o usuário está logado
     */
    updateUI(isLoggedIn) {
        const loginBtn = document.getElementById('login-btn');
        const logoutLink = document.getElementById('logout-link');
        const loginLink = document.getElementById('login-link');
        const registerLink = document.getElementById('register-link');
        
        if (!loginBtn) {
            return;
        }
        
        if (isLoggedIn && this.currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${this.currentUser.name}`;
            
            if (logoutLink) logoutLink.style.display = 'block';
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
        } else {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> Entrar`;
            
            if (logoutLink) logoutLink.style.display = 'none';
            if (loginLink) loginLink.style.display = 'block';
            if (registerLink) registerLink.style.display = 'block';
        }
    }
    
    /**
     * Faz o login do usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     */
    login(email, password) {
        // Para fins de demonstração, aceita qualquer login
        // Em uma aplicação real, você validaria as credenciais no servidor
        
        console.log('Logando com:', email, password);
        
        // Cria um usuário de demonstração
        const user = {
            id: generateRandomId(),
            name: email.split('@')[0],
            email: email,
            phone: '',
            isLoggedIn: true
        };
        
        // Salva o usuário no localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        
        // Atualiza o usuário atual
        this.currentUser = user;
        
        // Atualiza a interface
        this.updateUI(true);
        
        // Fecha o modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        
        // Exibe mensagem de sucesso
        if (typeof showNotification === 'function') {
            showNotification('Login realizado com sucesso!', 'success');
        } else {
            alert('Login realizado com sucesso!');
        }
    }
    
    /**
     * Registra um novo usuário
     * @param {string} name - Nome do usuário
     * @param {string} email - Email do usuário
     * @param {string} password - Senha do usuário
     * @param {string} phone - Telefone do usuário
     */
    register(name, email, password, phone) {
        // Para fins de demonstração, aceita qualquer registro
        // Em uma aplicação real, você salvaria os dados no servidor
        
        console.log('Registrando:', name, email, password, phone);
        
        // Cria um novo usuário
        const user = {
            id: generateRandomId(),
            name: name,
            email: email,
            phone: phone,
            isLoggedIn: true
        };
        
        // Salva o usuário no localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        
        // Atualiza o usuário atual
        this.currentUser = user;
        
        // Atualiza a interface
        this.updateUI(true);
        
        // Fecha o modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
        
        // Exibe mensagem de sucesso
        if (typeof showNotification === 'function') {
            showNotification('Cadastro realizado com sucesso!', 'success');
        } else {
            alert('Cadastro realizado com sucesso!');
        }
    }
    
    /**
     * Faz o logout do usuário
     */
    logout() {
        // Remove o usuário do localStorage
        localStorage.removeItem(this.STORAGE_KEY);
        
        // Reseta o usuário atual
        this.currentUser = null;
        
        // Atualiza a interface
        this.updateUI(false);
        
        // Exibe mensagem de sucesso
        if (typeof showNotification === 'function') {
            showNotification('Logout realizado com sucesso!', 'success');
        } else {
            alert('Logout realizado com sucesso!');
        }
    }
    
    /**
     * Verifica se o usuário está logado
     * @returns {boolean} Verdadeiro se o usuário estiver logado
     */
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    /**
     * Obtém o usuário atual
     * @returns {Object|null} Dados do usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

/**
 * Gera um ID aleatório
 * @returns {string} ID aleatório
 */
function generateRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Exporta a instância do serviço de autenticação
const Auth = new AuthService();
export default Auth; 