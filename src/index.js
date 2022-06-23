const express = require("express");
const app = express();
//importando biblioteca uuid e renomeando para uuidv4
const { v4: uuidv4 } = require("uuid");
//importanto middleware de uso do JSON
app.use(express.json());

//criando um array para armazenar nossas informações em tempo de execução
const customers = [];

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


app.listen (3333);