// __tests__/CheckoutService.test.js
import { CheckoutService } from '../../src/services/CheckoutService.js';
import { Pedido } from '../../src/domain/Pedido.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {

    // Declaração dos Test Doubles e do SUT (System Under Test)
    let checkoutService;
    let gatewayMock;
    let repositoryMock;
    let emailServiceMock;

    // Configuração (Arrange) comum a todos os testes
    beforeEach(() => {
        // Criamos os "dublês" para as dependências
        // Usamos jest.fn() para criar funções "espionáveis"
        gatewayMock = {
            cobrar: jest.fn()
        };
        repositoryMock = {
            salvar: jest.fn()
        };
        emailServiceMock = {
            enviarEmail: jest.fn()
        };

        // Injetamos os dublês no nosso SUT
        checkoutService = new CheckoutService(gatewayMock, repositoryMock, emailServiceMock);
    });

    // === Cenários de Verificação de Estado (Stubs) ===

    describe('Verificação de Estado (Stubs)', () => {
        it('deve retornar null se o GatewayPagamento recusar a cobrança', async () => {
            // Arrange
            // Configuramos o Stub do gateway para simular uma falha
            gatewayMock.cobrar.mockResolvedValue({ success: false, error: 'Pagamento recusado' });

            const carrinho = new CarrinhoBuilder().build();
            const cartao = '1234-5678';

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartao);

            // Assert (Verificação de Estado)
            // Verificamos se o estado de retorno do método é o esperado (null)
            expect(pedido).toBeNull();
        });

        it('deve retornar o pedido salvo com totalFinal correto para cliente PADRAO', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder()
                .comItens([new Item('Item 1', 50), new Item('Item 2', 30)]) // Total = 80
                .build();
            
            // Stub do Gateway: Simula sucesso
            gatewayMock.cobrar.mockResolvedValue({ success: true });

            // Stub do Repositório: Simula o pedido sendo salvo com ID
            const pedidoSalvoMock = new Pedido(1, carrinho, 80, 'PROCESSADO');
            repositoryMock.salvar.mockResolvedValue(pedidoSalvoMock);

            // Act
            const pedidoProcessado = await checkoutService.processarPedido(carrinho, '1234');

            // Assert (Verificação de Estado)
            expect(pedidoProcessado).toBe(pedidoSalvoMock); // O retorno é o pedido salvo
            expect(pedidoProcessado.id).toBe(1);
            expect(pedidoProcessado.totalFinal).toBe(80); // Verifica se o total está correto
        });
    });

    // === Cenários de Verificação de Comportamento (Mocks) ===

    describe('Verificação de Comportamento (Mocks)', () => {

        it('deve aplicar 10% de desconto ao chamar o GatewayPagamento se usuário for PREMIUM', async () => {
            // Arrange
            const usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Produto Premium', 200)]) // Total = 200
                .build();
            
            const cartao = '4567-8901';

            // Stubs para permitir o fluxo
            gatewayMock.cobrar.mockResolvedValue({ success: true });
            // O repo deve retornar algo para o fluxo continuar
            const pedidoSalvoMock = new Pedido(2, carrinho, 180, 'PROCESSADO');
            repositoryMock.salvar.mockResolvedValue(pedidoSalvoMock);

            // Act
            await checkoutService.processarPedido(carrinho, cartao);

            // Assert (Verificação de Comportamento)
            // Verificamos a *interação* com o mock do gateway.
            // O total de 200 deve ter 10% de desconto = 180
            expect(gatewayMock.cobrar).toHaveBeenCalledTimes(1);
            expect(gatewayMock.cobrar).toHaveBeenCalledWith(180, cartao);
        });

        it('deve chamar o EmailService com os dados corretos após pagamento bem-sucedido', async () => {
            // Arrange
            const usuario = UserMother.umUsuarioPadrao(); // email: 'padrao@email.com'
            const carrinho = new CarrinhoBuilder()
                .comUser(usuario)
                .comItens([new Item('Item Simples', 150)]) // Total = 150
                .build();

            // Stubs para o fluxo
            gatewayMock.cobrar.mockResolvedValue({ success: true });
            const pedidoSalvoMock = new Pedido(99, carrinho, 150, 'PROCESSADO');
            repositoryMock.salvar.mockResolvedValue(pedidoSalvoMock);

            // Act
            await checkoutService.processarPedido(carrinho, '1234');

            // Assert (Verificação de Comportamento)
            // Verificamos a *interação* com o mock de email.
            expect(emailServiceMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailServiceMock.enviarEmail).toHaveBeenCalledWith(
                'padrao@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido 99 no valor de R$150'
            );
        });

        it('NÃO deve chamar o EmailService nem o PedidoRepository se o pagamento falhar', async () => {
            // Arrange
            // Stub de falha
            gatewayMock.cobrar.mockResolvedValue({ success: false });
            
            const carrinho = new CarrinhoBuilder().build();

            // Act
            await checkoutService.processarPedido(carrinho, '1234');

            // Assert (Verificação de Comportamento)
            // Verificamos que as interações *não* ocorreram.
            expect(repositoryMock.salvar).not.toHaveBeenCalled();
            expect(emailServiceMock.enviarEmail).not.toHaveBeenCalled();
        });
    });
});