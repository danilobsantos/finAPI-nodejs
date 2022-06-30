const { response } = require("express");
const express = require("express");
const app = express();
//importando biblioteca uuid e renomeando para uuidv4
const { v4: uuidv4 } = require("uuid");
//importanto middleware de uso do JSON
app.use(express.json());

//criando um array para armazenar nossas informações em tempo de execução
const customers = [];

//middleware de verificação de contas.
function verifyIfExistsAccountCPF (request, response, next) {
    const { cpf } = request.headers;
    const customer = customers.find((customer) => customer.cpf == cpf);
    if(!customer){
        return response.status(400).json({error: "Customer not found!"});
    }

    request.customer = customer;
    return next();
}

//calculando o balanço da conta.
function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;      
        }else {
            return acc - operation.amount;
        }
    }, 0);
    return balance;
}

/*
 * DADOS DA CONTA
 * cpf - string
 * nome - string
 * id - uuid
 * statement - []
 */

//como sabemos o post é o método para criar, usaremos /account como o recurso
app.post("/account", (request, response) => {
    const { cpf, name } = request.body; //pegando cpf e nome utilizando conceito de desestruturação
    
    //Não deve ser possível cadastrar uma conta de CPF já existente.
    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );
    //regra caso o cpf já esteja cadastrado
    if (customerAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"});
    }    
        
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    });
    
    return response.status(201).send();
});

//usamos o método get para buscar, usaremos /statement como recurso
app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    return response.json(customer.statement);
});

//fazendo depósito na conta
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);
    return response.status(201).send();
});
//realizando saque na conta
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount) {
        return response.status(400).json({error: "Insufficient funds!"})
    };

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);
    return response.status(201).send();

})

//buscar extrato por data
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;
    //formatando a data e informando ao filtro que o horário não é relevante.
    const dateFormat = new Date(date + " 00:00");

    //filtro para retornar o extrato somente da data informada.
    const statement = customer.statement.filter((statement) =>
    statement.created_at.toDateString() ===
    new Date (dateFormat).toDateString()
    );

    //caso existe alguma movimentação neste dia, retorne o extrato
    return response.json(statement)

});

//atualizar dados do cliente
app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;
    return response.status(201).send();
});

//obter dados da conta
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer);
});

//deletar conta
app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;    
    customers.splice(customer, 1);
    return response.status(200).json(customers);
});

//retornando o balanço da conta
app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const balance = getBalance(customer.statement);
    
    return response.json(balance);
});


app.listen (3333);