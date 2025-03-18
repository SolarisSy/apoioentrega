/**
 * Módulo de pagamento para integração com a API Zippify
 */
const Payment = {
    apiUrl: "https://api.zippify.com.br/api/public/v1/transactions",
    apiToken: "klv5sbESYAohF9whCjjXnPQN2yjl3Tnh62dNy5AySG2QAd2LmqwFSmLEI2Zx",
    offerHash: "pdnczi9glx",
    productHash: "c3sw3gbybu",

    /**
     * Inicializa o módulo de pagamento
     */
    init() {
        console.log('Módulo de pagamento inicializado');
        
        // Configura a API e eventos necessários
        this.setupEvents();
        
        // Torna este módulo disponível globalmente
        window.payment = this;
    },
    
    /**
     * Configura eventos do módulo de pagamento
     */
    setupEvents() {
        window.addEventListener('payment:success', (event) => {
            console.log('Pagamento bem-sucedido:', event.detail);
        });
        
        window.addEventListener('payment:error', (event) => {
            console.error('Erro no pagamento:', event.detail);
        });
    },

    /**
     * Registra uma venda no sistema de monitoramento (se disponível)
     * @param {number} valor - Valor da venda
     * @param {string} produto - Nome do produto
     * @returns {Promise} Promessa que resolve quando o registro for concluído
     */
    async registrarVenda(valor, produto) {
        if (typeof monitor !== 'undefined') {
            try {
                await monitor.trackSale(valor, produto);
                console.log("Venda registrada com sucesso no monitor");
            } catch (error) {
                console.error("Erro ao registrar venda no monitor:", error);
            }
        }
    },

    /**
     * Função auxiliar que gera um nome aleatório
     * @returns {string} Nome aleatório
     */
    gerarNome() {
        const nomes = ["Miguel", "Arthur", "Gael", "Théo", "Heitor", "Ravi", "João", "Pedro", "Lorenzo", "Gabriel", 
                      "Sophia", "Alice", "Laura", "Maria", "Helena", "Valentina", "Júlia", "Heloísa", "Lívia", "Clara"];
        const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", 
                           "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];
        
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        
        return `${nome} ${sobrenome}`;
    },

    /**
     * Função auxiliar que gera um CPF aleatório válido
     * @returns {string} CPF aleatório
     */
    gerarCPF() {
        const gerarDigito = (arr) => {
            const soma = arr.reduce((acc, val, idx) => acc + val * (arr.length + 1 - idx), 0);
            const resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        };

        // Gera os 9 primeiros dígitos
        const numeros = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
        
        // Calcula os dígitos verificadores
        const digito1 = gerarDigito(numeros);
        const digito2 = gerarDigito([...numeros, digito1]);
        
        // Junta todos os números
        return [...numeros, digito1, digito2].join('');
    },

    /**
     * Função auxiliar que gera um email a partir de um nome
     * @param {string} nome - Nome para o email
     * @returns {string} Email gerado
     */
    gerarEmail(nome) {
        const dominios = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
        const dominio = dominios[Math.floor(Math.random() * dominios.length)];
        const nomeFormatado = nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return `${nomeFormatado}@${dominio}`;
    },

    /**
     * Função auxiliar que gera um número de telefone aleatório
     * @returns {string} Número de telefone
     */
    gerarTelefone() {
        const ddd = Math.floor(Math.random() * (99 - 11 + 1)) + 11;
        const numero = Math.floor(Math.random() * 900000000) + 100000000;
        return `${ddd}${numero}`;
    },

    /**
     * Gera um código PIX para pagamento
     * @param {number} total - Valor total do pagamento
     * @returns {Promise<Object>} Promessa com os dados do PIX gerado
     */
    async gerarPix(total) {
        console.log('Gerando PIX para valor:', total);
        
        try {
            // Busca dados do cliente autenticado ou usa dados do localStorage
            let customerData;
            try {
                const customerDataJson = localStorage.getItem('customer_data');
                if (customerDataJson) {
                    customerData = JSON.parse(customerDataJson);
                }
            } catch (error) {
                console.error('Erro ao carregar dados do cliente:', error);
            }
            
            // Se não tiver dados do cliente, gera aleatoriamente
            if (!customerData || !customerData.name || !customerData.email || !customerData.cpf) {
                console.log('Usando dados de cliente gerados aleatoriamente');
                const nomeGerado = this.gerarNome();
                customerData = {
                    name: nomeGerado,
                    document: this.gerarCPF(),
                    email: this.gerarEmail(nomeGerado),
                    phone: this.gerarTelefone()
                };
            }
            
            // Converte o valor para centavos
            const amountInCents = Math.round(total * 100);
            
            // Prepara o payload da requisição
            const requestBody = {
                amount: amountInCents,
                offer_hash: this.offerHash,
                payment_method: "pix",
                customer: {
                    name: customerData.name,
                    document: customerData.cpf || customerData.document,
                    email: customerData.email,
                    phone_number: customerData.phone
                },
                cart: [
                    {
                        product_hash: this.productHash,
                        title: "Produtos Apoio Entrega",
                        price: amountInCents,
                        quantity: 1,
                        operation_type: 1,
                        tangible: false,
                        cover: null
                    }
                ],
                installments: 1
            };
            
            console.log("Dados do cliente para pagamento:", requestBody.customer);
            
            // Faz a requisição para a API
            const response = await fetch(`${this.apiUrl}?api_token=${this.apiToken}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(requestBody)
            });
            
            // Processa a resposta
            const data = await response.json();
            console.log("Resposta da API Zippify:", data);
            
            // Verifica se houve erro
            if (!response.ok) {
                throw new Error(data.message || "Erro ao gerar PIX");
            }
            
            // Extrai os dados do PIX
            const qrCodeString = data?.pix?.pix_qr_code;
            const copyPasteCode = data?.pix?.pix_qr_code;
            
            if (!qrCodeString || !copyPasteCode) {
                throw new Error("QR Code ou código PIX não retornado pela API");
            }
            
            // Registra a venda
            await this.registrarVenda(amountInCents / 100, requestBody.cart[0].title);
            
            // Dispara evento de sucesso
            window.dispatchEvent(new CustomEvent('payment:success', {
                detail: {
                    amount: total,
                    pixCode: copyPasteCode
                }
            }));
            
            return { qrCodeString, copyPasteCode };
            
        } catch (error) {
            console.error("Erro ao gerar PIX:", error);
            
            // Dispara evento de erro
            window.dispatchEvent(new CustomEvent('payment:error', {
                detail: {
                    error: error.message
                }
            }));
            
            throw error;
        }
    },
    
    /**
     * Verifica o status de um pagamento PIX
     * @param {string} transactionId - ID da transação
     * @returns {Promise<Object>} Promessa com o status da transação
     */
    async checkPixStatus(transactionId) {
        try {
            const response = await fetch(`${this.apiUrl}/${transactionId}?api_token=${this.apiToken}`, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Erro ao verificar status do PIX");
            }
            
            return data;
        } catch (error) {
            console.error("Erro ao verificar status do PIX:", error);
            throw error;
        }
    }
};

// Inicializa o módulo quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    Payment.init();
});

export default Payment; 