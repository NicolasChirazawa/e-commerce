class Error {
    constructor() {
        // '0xx': Erros comuns | '1xx': Erros no processamento
        this.message = {
            '001': 'Nenhum dos campos deve estar vazio',
            '002': 'Já existe um usuário com esse username e email registrado',
            '003': 'Insira username ou email',
            '004': 'Insira a senha',
            '005': 'Usuário e/ou senha errada',
            '006': 'Usuário não encontrado',
            '007': 'Já existe um usuário com esse nome',
            '008': 'Já existe um usuário com esse e-mail',
            '009': 'Algum dos campos deve estar informado',
            '100': 'Erro no processamento do usuário',
            '101': 'Erro na criação usuário com o carrinho de compras',
            '102': 'Erro no processamento do login',
            '103': 'Erro no processamento dos usuários',
            '104': 'Erro no processamento do usuário',
            '105': 'Erro ao atualizar o usuário',
            '106': 'Erro ao deletar o usuário'
        };
    }

    getMessage(code) {
        return {
            error: this.message[code]
        };
    }
}

module.exports = Error;