const express = require('express');
const { v4: uuidv4 } = require("uuid")


const app = express();
app.use(express.json())

const customers = [];

function verifyIfExistsAccountCPF(request,response, next){
    const { cpf } = request.headers;
    const costumer = customers.find((customer) => customer.cpf === cpf)
    if(!costumer){
        return response.status(400).json({error: "Costumer not found"})
    }
    request.costumer = costumer
    return next();
}


function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit'){
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0) // essa função vai pegar as informações dos valores , em um valor somente 
    console.log(balance)
    return balance;
}



app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const {description,amount} = request.body;
    console.log(description, amount)
    const { costumer } = request;
    
    const statmentOperation = {
        description: description,
        amount: amount,
        created_at: new Date(),
        type: "credit"
    }
    costumer.statement.push(statmentOperation);
    return response.status(201).send();

})

app.get("/statement", verifyIfExistsAccountCPF, (request,response) => {
    const { costumer } = request;
    console.log(costumer)
    return response.status(200).json(costumer.statement)
})


app.post("/withdraw", verifyIfExistsAccountCPF, (request,response)=>{
    const { amount } = request.body
    const { costumer } = request;
    const balance = getBalance(costumer.statement);
    if(balance < amount){
        return response.status(400).json({error: "Insufficient funds!"})
    }
    console.log("cade o valor", amount)
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit",
    }

    costumer.statement.push(statementOperation);
    return response.status(200).send();

})
app.post("/account", (request,response)=> {
    const {cpf, name} = request.body;
    const custmoerAlreadyExists = customers.some((customer) => customer.cpf === cpf);

    if(custmoerAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"})
    }
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })
    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request,response) => {
    const { costumer } = request;
    const { date } = request.query
    const dateFormat = new Date(date + " 00:00");
    const statement = costumer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())
    return response.status(200).json(statement)
})

app.put("/account", verifyIfExistsAccountCPF, (request, response)=> {
    const {name} = request.body;
    const {costumer} = request;
    
    costumer.name = name;
    console.log(name)
    return response.status(201).send()
})

app.get("/account", verifyIfExistsAccountCPF, (request,response) => {
    const {costumer} = request
    return response.json(costumer);
})


app.delete("/account", verifyIfExistsAccountCPF, (request,response)=>{
    const {costumer} = request
    //splice
    customers.splice(costumer, 1);
    return response.status(200).json(customers)
})

app.get("/balance", verifyIfExistsAccountCPF, (request,response)=> {
    const {costumer} = request;

    const balance = getBalance(costumer.statement)
    return response.json(balance)

})




app.listen(3333, ()=> {
    console.log("Servidor iniciado")
});