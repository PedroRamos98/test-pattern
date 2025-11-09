// __tests__/builders/UserMother.js
import { User } from '../../src/domain/User.js';

export class UserMother {
    /**
     * @returns {User} Um usuário padrão com tipo 'PADRAO'.
     */
    static umUsuarioPadrao() {
        return new User(1, 'Usuário Padrão', 'padrao@email.com', 'PADRAO');
    }

    /**
     * @returns {User} Um usuário premium com tipo 'PREMIUM'.
     */
    static umUsuarioPremium() {
        return new User(2, 'Usuário Premium', 'premium@email.com', 'PREMIUM');
    }
}