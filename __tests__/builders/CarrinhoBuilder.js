// __tests__/builders/CarrinhoBuilder.js
import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

export class CarrinhoBuilder {
    constructor() {
        // Define valores padrão razoáveis
        this.user = UserMother.umUsuarioPadrao();
        this.itens = [new Item('Item Padrão', 100)];
    }

    /**
     * Define um usuário específico para o carrinho.
     * @param {User} user O usuário.
     * @returns {CarrinhoBuilder} A própria instância do builder.
     */
    comUser(user) {
        this.user = user;
        return this;
    }

    /**
     * Define os itens específicos para o carrinho.
     * @param {Item[]} itens A lista de itens.
     * @returns {CarrinhoBuilder} A própria instância do builder.
     */
    comItens(itens) {
        this.itens = itens;
        return this;
    }

    /**
     * Define o carrinho como vazio (sem itens).
     * @returns {CarrinhoBuilder} A própria instância do builder.
     */
    vazio() {
        this.itens = [];
        return this;
    }

    /**
     * Constrói e retorna a instância final do Carrinho.
     * @returns {Carrinho}
     */
    build() {
        return new Carrinho(this.user, this.itens);
    }
}