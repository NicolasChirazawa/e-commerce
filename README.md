<div align=center>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=fffdaf&message=Javascript&color=grey&style=for-the-badge&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=d1ffbd&message=Node.JS&color=grey&style=for-the-badge&logo=node.js&logoColor=black"/>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=white&message=Express.JS&color=grey&style=for-the-badge&logo=express&logoColor=black"/> <br>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=9fb6fd&message=Postgres&color=grey&style=for-the-badge&logo=postgreSQL&logoColor=black"/>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=eb7871&message=Redis&color=grey&style=for-the-badge&logo=Redis&logoColor=black"/>
  <img src="https://img.shields.io/static/v1?label=%20&labelColor=eb7871&message=BullMQ&color=grey&style=for-the-badge&logo=BullMQ&logoColor=black"/>
</div> <br>

<div align="center">
 • <a href=#descricao>Descrição</a> • <a href=#inicializar>Inicializando</a> • <a href=#endpoint>Endpoint</a> • <a href=#bd>Banco de Dados</a> • <a href=#lista_ideais>Lista de Ideias</a> •
</div>

<h2 name="descricao">💻 Descrição</h2>
Um estudo para o desenvolvimento do backend de e-commerce.

<h3>Funcionalidades</h3>
• <b>CRUD</b> de usuário e produto; <br>
• Login com autorização e autenticação através de <b>JSON Web Token</b>; <br>
• Carrinhos de compra por usuário; <br>
• Revisão do preço e disponibilidade dos itens ao pagar o carrinho; <br>
• Pagamento por <b>cartão de crédito</b> e <b>PIX</b> respectivamente manejados pelos Gateways de Pagamento <b>Stripe</b> e <b>AbacatePay</b>; <br>
• Processamento da resposta dos pagamentos por PIX através do <b>BullMQ</b> para controlar os itens reservados e o status do carrinho; <br>
• Suporte de testes unitários e integrados utilizando do <b>Node Test Runner</b>; <br>

<h2 name="inicializar">🚀 Inicializando</h2>
Passos para utilizar este projeto: <br>

<div align="center"><h6> / Instalação do projeto / Configuração das variáveis de ambiente / Instalações dos Softwares / Inicialização /</h6></div>

<h3>Instalação do projeto</h3>

Clone o projeto ou <a href="https://github.com/NicolasChirazawa/e-commerce/archive/refs/heads/main.zip">baixe-o</a>; <br>

```
gh repo clone NicolasChirazawa/e-commerce
```

<h3>Definindo as variáveis de ambientes</h3>

Use o arquivo <b>'.env-teste'</b> de referência para criar o seu próprio <b>'.env'</b>, 
e defina as seguintes variáveis de acordo a descrição.

```env
SERVER_PORT = /* Porta do Express */

POSTGRES_HOST =     /* Configuração do host do Postgres */
POSTGRES_PORT =     /* Configuração da porta do Postgres */
POSTGRES_DATABASE = /* Configuração da base de dados do Postgres */
POSTGRES_USER =     /* Configuração do user do Postgres */
POSTGRES_PASSWORD = /* Configuração da senha do Postgres */

REDIS_HOST = /* Configuração do host do Redis */ 
REDIS_PORT = /* Configuração da porta do Redis */

JWT_SECRET = /* Segredo do JWT */

STRIPE_SECRET_KEY =  /* Chave do gateway de pagamento Stripe */
ABACATE_SECRET_KEY = /* Chave do gateway de pagamento Abacate Pay */
```

<h3>Softwares necessários</h3>

• Docker (<a href="https://docs.docker.com/desktop/setup/install/windows-install/">Windows</a> / <a href="https://docs.docker.com/desktop/setup/install/linux/">Linux</a>); <br>
• <a href="postgresql.org/download/">Postgres</a>; <br>
<h6>Recomendação: Um editor de código: <a href="https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user">Visual Studio Code</a>; </h6>
<h6>Recomendação: Um Cliente API para manejar requisições, como o: <a href="https://dl.pstmn.io/download/latest/win64">Postman</a> 
  ou o <a href="https://updates.insomnia.rest/downloads/windows/latest?app=com.insomnia.app">Insomnia</a>; </h6>

<h3>Inicialização</h3>

```
docker-compose up
```
<h2 name="endpoint">📍 Endpoints API</h2>
<h3>Users</h3>

| rotas                    | descrição                                                  |
| ------------------------ | :---:                                                      |
| `POST/register`          | Registra um usuário.                                       |
| `POST/login`             | Loga no sistema para gerar um JWT.                         |
| `GET/users`              | Apanha informações dos usuários.                           |
| `GET/users:/user_id`     | Apanha informação do usuário selecionado.                  |
| `PUT/users:/user_id`     | Atualiza todas as informações do usuário selecionado.      |
| `DELETE/users:/user_id`  | Deleta um usuário específico.                              |
| `PATCH/users:/user_id`   | Atualiza um ou mais campos de um usuário específico.       |

<h3>Products</h3>

| rotas                         | descrição                                                  |
| ----------------------------- | :---:                                                      |
| `POST/products`               | Registra um produto.                                       |
| `GET/products`                | Apanha informações dos produtos.                           |
| `GET/products:/product_id`    | Apanha informação do produto selecionado.                  |
| `PUT/products:/product_id`    | Atualiza todas as informações do produto selecionado.      |
| `DELETE/products:/product_id` | Deleta um produto específico.                              |
| `PATCH/products:/product_id`  | Atualiza um ou mais campos de um produto específico.       |

<h3>Shopping_Products</h3>

| rotas                            | descrição                                                                |
| -------------------------------- | :---:                                                                    |
| `GET/shoppingCart`               | Apanha os itens de todos os carrinhos de compra.                         |
| `GET/shoppingCart/:cart_id`      | Apanha os itens de um carrinho de compra específico                      |
| `POST/currentCart/:product_id`   | Acrescenta um item no carrinho de compras atual.                         |
| `GET/currentCart`                | Apanha informações do carrinho de compra atual do usuário.               |
| `DELETE/currentCart/:product_id` | Deleta um produto do carrinho de compras atual do usuário.               |
| `PATCH/currentCart/:product_id`  | Atualiza um atributo específico do carrinho de compras atual do usuário. |
| `POST/updatePrice`               | Atualiza o preço dos itens do carrinho de compra atual do usuário.       |
| `POST/verifyStorage`             | Verifica os itens do carrinho de compra atual.                           |

<h3>Products</h3>

| rotas                         | descrição                                                  |
| ----------------------------- | :---:                                                      |
| `POST/payment`                | Gera o código PIX para pagamento de um carrinho de compra. |

<h2 name="bd">🧱 Banco de dados</h2>
<img src="https://raw.githubusercontent.com/NicolasChirazawa/e-commerce/refs/heads/main/images/bd_model.png"/>

<h2 name="lista_ideais">📋 Lista de Tarefas</h2>

- [X] Estruturação do banco de dados;
- [X] CRUD usuários;
- [X] Login de usuários com bcrypt e JWT;
- [X] CRUD de produtos;
- [X] Carrinho de compras por usuário;
- [X] Testes unitários;
- [X] Testes integrados;
- [X] Verificação de produtos no estoque ao pagar;
- [X] Verificação da precificação dos produtos no carrinho de compras;
- [X] Implementação do Gateway de pagamento Stripe;
- [X] Implementação do Gateway de pagamento AbacatePay;
- [X] Implementação do BullMQ para o processamento do PIX;
- [ ] Criação do Docker;
- [ ] Criação do Swagger para documentação da API;
