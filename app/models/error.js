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
            '010': 'Já existe um produto com esse nome',
            '011': 'Não foi possível encontrar um produto com o id informado',
            '012': 'Pelo menos um dos campos deve estar informado',
            '013': 'É necessário se logar para usar esse endpoint',
            '014': 'O token usado é inválido',
            '015': 'Insira uma quantidade válida no carrinho',
            '016': 'Foi adicionado uma quantidade maior que o estoque disponível',
            '017': 'Não foi encontrado o carrinho de compra',
            '018': 'Não foi encontrado o item informado no carrinho de compra',
            '019': 'Este item já foi adicionado ao carrinho',
            '020': 'Método de pagamento inválido',
            '021': 'O carrinho já foi fechado',
            '100': 'Erro no processamento do usuário',
            '101': 'Erro na criação usuário com o carrinho de compras',
            '102': 'Erro no processamento do login',
            '103': 'Erro no processamento dos usuários',
            '104': 'Erro no processamento do usuário',
            '105': 'Erro ao atualizar o usuário',
            '106': 'Erro ao deletar o usuário',
            '107': 'Erro no processamento do produto',
            '108': 'Erro ao criar o produto',
            '109': 'Erro ao selecionar o produto',
            '110': 'Erro ao atualizar o produto',
            '111': 'Erro ao deletar o produto',
            '112': 'Erro ao adicionar um item no carrinho de compra',
            '113': 'Erro no processamento do carrinho de compra',
            '114': 'Ocorreu um erro na busca do produto no carrinho de compra',
            '115': 'Ocorreu um erro na deleção do produto no carrinho de compra',
            '116': 'Ocorreu um erro ao atualizar a quantidade do produto no carrinho de compra',
            '117': 'Erro no processamento dos carrinhos de compra',
            '118': 'Erro no processamento do pagamento',
            '119': 'Erro na criação do PIX',
            '120': 'Erro na obtenção do status do carrinho'
        };
    }

    getMessage(code) {
        return {
            error: this.message[code]
        };
    }
}

module.exports = Error;