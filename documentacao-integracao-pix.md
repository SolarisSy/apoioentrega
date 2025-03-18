# Documentação Técnica: Integração de Pagamento via Pix

## 1. Visão Geral da Integração

### 1.1 Objetivo

A integração do sistema de pagamento via Pix no checkout do e-commerce Apoio Entrega tem como objetivo oferecer aos clientes uma forma de pagamento instantânea, segura e sem fricção, aumentando a taxa de conversão e melhorando a experiência do usuário durante o processo de finalização da compra.

### 1.2 Fluxo Básico do Pagamento

O fluxo de pagamento via Pix implementado segue as seguintes etapas:

1. **Criação do pedido**: O cliente finaliza a seleção de produtos e inicia o checkout
2. **Geração do QR Code**: O sistema se comunica com a API do gateway de pagamento (Zippify) para gerar um QR Code Pix dinâmico
3. **Exibição do QR Code**: O cliente visualiza o QR Code e as instruções de pagamento
4. **Pagamento**: O cliente efetua o pagamento utilizando seu aplicativo bancário
5. **Confirmação**: O sistema recebe a confirmação do pagamento e atualiza o status do pedido
6. **Rastreamento**: A transação é registrada para fins de monitoramento

### 1.3 APIs e Serviços Utilizados

A integração utiliza os seguintes serviços e APIs:

- **Zippify API**: Gateway de pagamento principal para processamento de transações Pix
- **Sistema de autenticação interno**: Para validação do usuário durante o checkout
- **QR Code Generator**: Biblioteca para renderização do QR Code na interface

## 2. Requisitos Técnicos

### 2.1 Tecnologias e Frameworks Compatíveis

A implementação atual é compatível com:

- **Navegadores**: Chrome 60+, Firefox 55+, Safari 11+, Edge 16+
- **JavaScript**: ES6+ (ECMAScript 2015 ou superior)
- **Bibliotecas**: QRCode.js para renderização do QR Code
- **Armazenamento**: localStorage para configurações persistentes

### 2.2 Credenciais e Configuração

Para utilizar a integração, são necessárias as seguintes credenciais:

- **API Token**: Chave de autenticação para a API Zippify
- **Offer Hash**: Identificador da oferta no sistema Zippify
- **Product Hash**: Identificador do produto no sistema Zippify

Estas credenciais são armazenadas no localStorage para persistência entre sessões, mas podem ser configuradas via painel administrativo.

### 2.3 Dependências

- Sistema de autenticação (`auth.js`) para identificação do usuário
- Biblioteca QRCode.js para renderização do QR Code

## 3. Configuração Inicial

### 3.1 Registro no Provedor de Pagamentos

1. Acesse o site da [Zippify](https://zippify.com.br) e crie uma conta
2. Complete o processo de verificação e ativação da conta
3. Forneça os documentos necessários para validação do negócio
4. Aguarde a aprovação da conta para uso em produção

### 3.2 Geração e Configuração das Chaves de API

1. No painel da Zippify, acesse a seção "Integrações" > "API Keys"
2. Gere um novo token de API com as permissões necessárias:
   - Criação de transações
   - Consulta de status de pagamento
   - Gerenciamento de webhooks
3. Copie o token gerado e armazene-o de forma segura
4. No painel da Zippify, acesse "Produtos" e "Ofertas" para obter os hashes necessários

### 3.3 Configuração no E-commerce

1. Acesse o painel administrativo do Apoio Entrega
2. Navegue até "Configurações" > "Pagamentos" > "Pix"
3. Insira as credenciais obtidas:
   - API Token
   - Offer Hash
   - Product Hash
4. Salve as configurações

### 3.4 Configuração de Ambientes

A API da Zippify oferece dois ambientes:

- **Sandbox**: Para testes e desenvolvimento (`https://sandbox.api.zippify.com.br/api/public/v1/transactions`)
- **Produção**: Para transações reais (`https://api.zippify.com.br/api/public/v1/transactions`)

Para alternar entre os ambientes, modifique a URL base (`apiUrl`) nas configurações do sistema de pagamento.

## 4. Implementação da Integração no Checkout

### 4.1 Criando a Ordem de Pagamento

#### 4.1.1 Estrutura da Requisição

Para criar uma ordem de pagamento Pix, é necessário enviar uma requisição POST para a API da Zippify com os seguintes dados:

```javascript
const requestBody = {
    amount: amountInCents,           // Valor em centavos
    offer_hash: this.offerHash,      // Hash da oferta
    payment_method: "pix",           // Método de pagamento
    customer: {
        name: nomeCliente,           // Nome do cliente
        document: cpfCliente,        // CPF do cliente
        email: emailCliente,         // Email do cliente
        phone_number: telefoneCliente // Telefone do cliente
    },
    cart: [
        {
            product_hash: this.productHash, // Hash do produto
            title: "Nome do Produto",       // Título do produto
            price: amountInCents,           // Preço em centavos
            quantity: 1,                    // Quantidade
            operation_type: 1,              // Tipo de operação (1 = venda)
            tangible: false,                // Produto físico ou digital
            cover: null                     // URL da imagem (opcional)
        }
    ],
    installments: 1                  // Número de parcelas (sempre 1 para Pix)
};
```

#### 4.1.2 Geração do QR Code

Após o envio da requisição, a API retornará os dados do QR Code Pix:

```javascript
// Exemplo de resposta da API
{
    "pix": {
        "pix_qr_code": "00020101021226880014br.gov.bcb.pix2566qrcodes-pix.zippify.com.br/v2/cobv/9d36b84f10454c9b8024ab8718b775e552040000530398654041.005802BR5925ZIPPIFY INTERMEDIACAO DE 6009SAO PAULO62070503***63040B16",
        "pix_expiration_date": "2023-12-31T23:59:59Z"
    },
    "transaction": {
        "id": "9d36b84f-1045-4c9b-8024-ab8718b775e5",
        "status": "pending"
    }
}
```

#### 4.1.3 Implementação da Geração do QR Code

O método `gerarPix()` no arquivo `payment.js` implementa a lógica para geração do QR Code:

```javascript
async gerarPix(total) {
    // Verifica se o usuário está autenticado
    const user = auth.getCurrentUser();
    if (!user) {
        alert('Você precisa estar logado para finalizar a compra.');
        window.location.href = 'login.html';
        return;
    }

    // Converte o valor para centavos
    const amountInCents = Math.round(total * 100);
    
    // Gera ou obtém dados do cliente
    const clientData = {
        name: user.name || this.gerarNome(),
        email: user.email || this.gerarEmail(user.name || this.gerarNome()),
        phone: user.phone || this.gerarTelefone(),
        document: this.gerarCPF()
    };

    // Monta o corpo da requisição
    const requestBody = {
        amount: amountInCents,
        offer_hash: this.offerHash,
        payment_method: "pix",
        customer: {
            name: clientData.name,
            document: clientData.document,
            email: clientData.email,
            phone_number: clientData.phone
        },
        cart: [
            {
                product_hash: this.productHash,
                title: "Produto",
                price: amountInCents,
                quantity: 1,
                operation_type: 1,
                tangible: false,
                cover: null
            }
        ],
        installments: 1
    };

    // Envia a requisição para a API
    const response = await fetch(`${this.apiUrl}?api_token=${this.apiToken}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // Extrai os dados do QR Code
    const qrCodeString = data?.pix?.pix_qr_code;
    const copyPasteCode = data?.pix?.pix_qr_code;

    // Registra a venda para monitoramento
    await this.registrarVenda(amountInCents / 100, requestBody.cart[0].title, clientData);

    return { qrCodeString, copyPasteCode };
}
```

#### 4.1.4 Renderização do QR Code na Interface

O método `renderQrCode()` implementa a lógica para exibir o QR Code na interface:

```javascript
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
```

### 4.2 Processando Pagamentos

#### 4.2.1 Fluxo do Usuário

1. O usuário visualiza o QR Code na tela de checkout
2. Ele pode:
   - Escanear o QR Code com o aplicativo do banco
   - Copiar o código Pix e colar no aplicativo do banco
3. O usuário confirma o pagamento em seu aplicativo bancário
4. O sistema aguarda a confirmação do pagamento

#### 4.2.2 Verificação do Status da Transação

Para verificar o status da transação, é necessário implementar uma consulta periódica à API da Zippify:

```javascript
async verificarStatusTransacao(transactionId) {
    try {
        const response = await fetch(`${this.apiUrl}/${transactionId}?api_token=${this.apiToken}`, {
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        });

        const data = await response.json();
        return data.transaction.status;
    } catch (error) {
        console.error("Erro ao verificar status da transação:", error);
        return "error";
    }
}
```

Os possíveis status retornados são:

- `pending`: Pagamento pendente
- `approved`: Pagamento aprovado
- `canceled`: Pagamento cancelado
- `expired`: Pagamento expirado
- `refunded`: Pagamento estornado

#### 4.2.3 Implementação do Polling de Status

Para uma melhor experiência do usuário, é recomendado implementar um sistema de polling para verificar o status da transação periodicamente:

```javascript
iniciarVerificacaoStatus(transactionId) {
    const statusElement = document.getElementById('payment-status');
    
    // Define o intervalo de verificação (a cada 5 segundos)
    const interval = setInterval(async () => {
        const status = await this.verificarStatusTransacao(transactionId);
        
        // Atualiza o status na interface
        statusElement.textContent = this.traduzirStatus(status);
        
        // Se o pagamento foi aprovado ou cancelado, interrompe a verificação
        if (status === 'approved') {
            clearInterval(interval);
            this.finalizarPedido(transactionId);
        } else if (status === 'canceled' || status === 'expired') {
            clearInterval(interval);
            this.exibirMensagemErro(status);
        }
    }, 5000);
    
    // Armazena o ID do intervalo para poder cancelá-lo posteriormente
    this.statusInterval = interval;
}

traduzirStatus(status) {
    const statusMap = {
        'pending': 'Aguardando pagamento',
        'approved': 'Pagamento aprovado',
        'canceled': 'Pagamento cancelado',
        'expired': 'Pagamento expirado',
        'refunded': 'Pagamento estornado',
        'error': 'Erro ao verificar status'
    };
    
    return statusMap[status] || 'Status desconhecido';
}
```

### 4.3 Confirmação Automática do Pagamento

#### 4.3.1 Implementação de Webhooks

Para receber notificações automáticas sobre mudanças no status do pagamento, é necessário implementar um endpoint de webhook:

1. Crie um endpoint em seu backend para receber as notificações:

```javascript
// Exemplo de implementação em Node.js com Express
app.post('/api/webhooks/payment', (req, res) => {
    const { transaction } = req.body;
    
    // Verifica a autenticidade da notificação
    if (!verificarAssinaturaWebhook(req)) {
        return res.status(401).json({ error: 'Assinatura inválida' });
    }
    
    // Processa a notificação
    if (transaction.status === 'approved') {
        atualizarStatusPedido(transaction.id, 'approved');
    } else if (transaction.status === 'canceled' || transaction.status === 'expired') {
        atualizarStatusPedido(transaction.id, 'canceled');
    }
    
    // Responde com sucesso
    res.status(200).json({ success: true });
});
```

2. Configure o webhook no painel da Zippify:
   - Acesse "Integrações" > "Webhooks"
   - Adicione a URL do seu endpoint
   - Selecione os eventos que deseja receber (payment.approved, payment.canceled, etc.)
   - Salve a configuração

#### 4.3.2 Atualização do Status do Pedido

Quando o webhook recebe uma notificação de pagamento aprovado, é necessário atualizar o status do pedido no banco de dados:

```javascript
function atualizarStatusPedido(transactionId, status) {
    // Busca o pedido pelo ID da transação
    const pedido = buscarPedidoPorTransacao(transactionId);
    
    if (!pedido) {
        console.error(`Pedido não encontrado para a transação ${transactionId}`);
        return;
    }
    
    // Atualiza o status do pedido
    pedido.status = status === 'approved' ? 'pago' : 'cancelado';
    pedido.dataAtualizacao = new Date();
    
    // Salva as alterações
    salvarPedido(pedido);
    
    // Se o pagamento foi aprovado, inicia o processamento do pedido
    if (status === 'approved') {
        iniciarProcessamentoPedido(pedido);
    }
}
```

#### 4.3.3 Registro de Transações

Para fins de rastreamento e auditoria, é importante registrar todas as transações:

```javascript
function registrarTransacao(transacao) {
    const transacoes = JSON.parse(localStorage.getItem('transacoes') || '[]');
    
    // Adiciona a nova transação
    transacoes.push({
        id: transacao.id,
        pedidoId: transacao.pedidoId,
        valor: transacao.valor,
        status: transacao.status,
        metodo: 'pix',
        data: new Date().toISOString()
    });
    
    // Salva no localStorage
    localStorage.setItem('transacoes', JSON.stringify(transacoes));
}
```

#### 4.3.4 Notificação ao Cliente

Após a confirmação do pagamento, é importante notificar o cliente:

```javascript
function notificarCliente(pedido) {
    // Envia e-mail de confirmação
    enviarEmailConfirmacao(pedido);
    
    // Exibe notificação na interface
    exibirNotificacao({
        tipo: 'sucesso',
        titulo: 'Pagamento confirmado!',
        mensagem: `Seu pedido #${pedido.id} foi confirmado e está sendo processado.`,
        duracao: 5000
    });
}
```

## 5. Considerações de Segurança

### 5.1 Proteção de Credenciais

- Nunca exponha o API Token diretamente no código frontend
- Considere implementar um proxy no backend para realizar as chamadas à API
- Utilize variáveis de ambiente para armazenar credenciais sensíveis

### 5.2 Validação de Webhooks

- Implemente verificação de assinatura para validar a autenticidade dos webhooks
- Verifique o IP de origem das requisições de webhook
- Implemente rate limiting para prevenir ataques de força bruta

### 5.3 Tratamento de Erros

- Implemente tratamento adequado de erros em todas as chamadas à API
- Registre logs detalhados para facilitar a depuração
- Forneça mensagens de erro amigáveis para o usuário

## 6. Testes e Homologação

### 6.1 Ambiente de Sandbox

A Zippify oferece um ambiente de sandbox para testes:

1. Configure o `apiUrl` para apontar para o ambiente de sandbox
2. Utilize as credenciais de teste fornecidas pela Zippify
3. Realize testes completos do fluxo de pagamento

### 6.2 Casos de Teste

- **Pagamento bem-sucedido**: Verifique se o sistema processa corretamente um pagamento aprovado
- **Pagamento cancelado**: Teste o comportamento quando um pagamento é cancelado
- **Pagamento expirado**: Verifique o comportamento quando o tempo de pagamento expira
- **Falha na geração do QR Code**: Teste o tratamento de erros quando a API retorna um erro
- **Webhook não recebido**: Verifique o comportamento quando o webhook não é recebido

### 6.3 Checklist de Homologação

- [ ] QR Code é gerado corretamente
- [ ] Código Pix copia e cola funciona
- [ ] Status da transação é atualizado corretamente
- [ ] Webhooks são recebidos e processados
- [ ] Pedidos são atualizados após confirmação do pagamento
- [ ] E-mails de confirmação são enviados

## 7. Considerações para Produção

### 7.1 Monitoramento

- Implemente monitoramento de disponibilidade da API
- Configure alertas para falhas nas chamadas à API
- Monitore a taxa de conversão e abandono no checkout

### 7.2 Performance

- Otimize o tamanho do QR Code para carregamento rápido
- Implemente cache para reduzir o número de chamadas à API
- Utilize CDN para servir assets estáticos

### 7.3 Escalabilidade

- Projete o sistema para lidar com picos de tráfego
- Implemente filas para processamento assíncrono de webhooks
- Considere a implementação de um sistema de cache distribuído

## 8. Referências

- [Documentação oficial da API Zippify](https://docs.zippify.com.br)
- [Especificação Pix do Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Biblioteca QRCode.js](https://github.com/davidshimjs/qrcodejs)
- [Melhores práticas para implementação de webhooks](https://webhooks.fyi)

## 9. Suporte e Troubleshooting

### 9.1 Problemas Comuns

- **QR Code não é gerado**: Verifique as credenciais da API e a conexão com o servidor
- **Pagamento não é confirmado**: Verifique a configuração dos webhooks
- **Erro na geração do Pix**: Verifique os dados do cliente e do pedido

### 9.2 Contatos de Suporte

- Suporte Zippify: suporte@zippify.com.br
- Equipe de Desenvolvimento: dev@apoioentrega.com.br
- Documentação Interna: [Wiki do Projeto](https://wiki.apoioentrega.com.br) 