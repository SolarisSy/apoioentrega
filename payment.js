// Funções de Pagamento PIX
const payment = {
    apiUrl: "https://api.zippify.com.br/api/public/v1/transactions",
    apiToken: "klv5sbESYAohF9whCjjXnPQN2yjl3Tnh62dNy5AySG2QAd2LmqwFSmLEI2Zx",

    // Função para registrar venda no monitor
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

    // Funções auxiliares para gerar dados aleatórios
    gerarNome() {
        const nomes = ["Miguel", "Arthur", "Gael", "Théo", "Heitor", "Ravi", "João", "Pedro", "Lorenzo", "Gabriel", 
                      "Sophia", "Alice", "Laura", "Maria", "Helena", "Valentina", "Júlia", "Heloísa", "Lívia", "Clara"];
        const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", 
                           "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida"];
        
        const nome = nomes[Math.floor(Math.random() * nomes.length)];
        const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
        
        return `${nome} ${sobrenome}`;
    },

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

    gerarEmail(nome) {
        const dominios = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];
        const dominio = dominios[Math.floor(Math.random() * dominios.length)];
        const nomeFormatado = nome.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return `${nomeFormatado}@${dominio}`;
    },

    gerarTelefone() {
        const ddd = Math.floor(Math.random() * (99 - 11 + 1)) + 11;
        const numero = Math.floor(Math.random() * 900000000) + 100000000;
        return `${ddd}${numero}`;
    },

    async gerarPix(total) {
        const user = auth.getCurrentUser();

        if (!user) {
            alert('Você precisa estar logado para finalizar a compra.');
            window.location.href = 'login.html';
            return;
        }

        const amountInCents = Math.round(total * 100);
        
        // Gera dados aleatórios para o cliente
        const nomeGerado = this.gerarNome();
        const cpfGerado = this.gerarCPF();
        const emailGerado = this.gerarEmail(nomeGerado);
        const telefoneGerado = this.gerarTelefone();

        const requestBody = {
            amount: amountInCents,
            offer_hash: "pdnczi9glx",
            payment_method: "pix",
            customer: {
                name: nomeGerado,
                document: cpfGerado,
                email: emailGerado,
                phone_number: telefoneGerado
            },
            cart: [
                {
                    product_hash: "c3sw3gbybu",
                    title: "Robux",
                    price: amountInCents,
                    quantity: 1,
                    operation_type: 1,
                    tangible: false,
                    cover: null
                }
            ],
            installments: 1
        };

        try {
            console.log("Dados do cliente gerados:", requestBody.customer);
            
            const response = await fetch(`${this.apiUrl}?api_token=${this.apiToken}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log("Resposta da API:", data);

            if (!response.ok) {
                throw new Error(data.message || "Erro ao gerar Pix.");
            }

            const qrCodeString = data?.pix?.pix_qr_code;
            const copyPasteCode = data?.pix?.pix_qr_code;

            if (!qrCodeString || !copyPasteCode) {
                throw new Error("QR Code ou código Pix não retornado pela API.");
            }

            // Registra a venda
            await this.registrarVenda(amountInCents / 100, requestBody.cart[0].title);

            return { qrCodeString, copyPasteCode };
        } catch (error) {
            console.error("Erro:", error);
            alert(`Erro ao gerar pagamento: ${error.message}`);
            throw error;
        }
    },

    renderQrCode(qrCodeString, copyPasteCode) {
        const qrCodeElement = document.getElementById('qr-code');
        const pixCodeElement = document.getElementById('pix-code');

        // Renderiza QR Code
        qrCodeElement.innerHTML = '';
        new QRCode(qrCodeElement, {
            text: qrCodeString,
            width: 200,
            height: 200,
        });

        // Atualiza código copia e cola
        pixCodeElement.value = copyPasteCode;
    }
}; 