const { request } = require('express')
const express = require('express')
const {v4: uuidv4} = require('uuid')

const app = express()

app.use(express.json())

const customers = []

// Middleware
function verifyIfExistsAccountByCPF(req, res, next){
  const {cpf} = req.headers

  //Buscando o cliente existente
  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return res.status(404).json({error: "Customer not found"})
  }
  
  req.customer = customer

  return next()
}

function getBalance(statements){
  // let sum = 0
  const balance = statements.reduce((acc, statement) => {
    if(statement.type === 'credit'){
      return acc + statement.amount
    }
    else{
      return acc - statement.amount
    }
  }, 0)

  return balance
}

//1 - Criando uma conta do cliente      
app.post("/accounts", (req, res) => {
  
  const {cpf, name} = req.body

  //Validação do CPF existente
  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if(customerAlreadyExists){
    return res.status(400).json({error: "Customer already exists!"})
  }

  customers.push({cpf, name, id: uuidv4(), statement: []})

  return res.status(201).send()
})

//2 - Buscando todos os extratos bancários do cliente
app.get('/statements', verifyIfExistsAccountByCPF, (req, res) => {
  const {customer} = req
  return res.json(customer.statement)
})

//Todas as rotas deverão passar pelo middleware abaixo antes de completar a requisição
// app.use(verifyIfExistsAccountByCPF)

// 3 - Realizando depósito
app.post("/deposit", verifyIfExistsAccountByCPF, (req, res) => {
  const {description, amount} = req.body
  const {customer} = req

  const statementDto = {
    description,
    amount,
    type: 'credit',
    created_at: new Date().toLocaleDateString()
  }

  customer.statement.push(statementDto)
  
  return res.status(201).send()
})

// 4 - Realizando saque
app.post("/withdraw", verifyIfExistsAccountByCPF, (req, res) => {
  const {amount} = req.body
  const {customer} = req

  const balance = getBalance(customer.statement)

  if(balance < amount){
    return res.status(400).json({message: "Not enough funds!"})
  }  
  
  const statementDto = {    
    amount,
    type: 'debit',
    created_at: new Date().toLocaleDateString()
  }

  customer.statement.push(statementDto)

  return res.status(201).send()
})

// 5 - Obtendo extratos bancários do cliente por data
app.get('/statements/date', verifyIfExistsAccountByCPF, (req, res) => {
  const {customer} = req
  const {date} = req.query

  const statementByDate = customer.statement.filter(statement => statement.created_at === date)

  if(!statementByDate){
    return res.status(404).json({message: 'Statement not found'})
  }

  return res.json(statementByDate)
})

//6 - Atualizando os dados do cliente
app.put('/accounts', verifyIfExistsAccountByCPF, (req, res) => {
  const {name} = req.body
  const {customer} = req
  
  customer.name = name

  return res.status(204).send()
})

//7 - Listando os dados da conta do cliente 
app.get('/accounts', verifyIfExistsAccountByCPF, (req, res) => {  
  const {customer} = req

  return res.json(customer)
})

//8 - Excluindo uma conta 
app.delete('/accounts', verifyIfExistsAccountByCPF, (req, res) => { 
  const {customer} = req

  customers.pop(customer)

  return res.status(204).json(customers)

})

//9 - Obtendo o saldo da conta do cliente 
app.get('/balance', verifyIfExistsAccountByCPF, (req, res) => { 
  const {customer} = req

  const balance = getBalance(customer.statement)

  return res.json(balance)
})

app.listen(3000, () => console.log('Server is running...'))