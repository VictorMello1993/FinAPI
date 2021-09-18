const express = require('express')
const {v4: uuidv4} = require('uuid')

const app = express()

app.use(express.json())

const customers = []

//1 - Criando uma conta do cliente      
app.use("/accounts", (req, res) => {
  
  const {cpf, name} = req.body

  //Validação do CPF existente
  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if(customerAlreadyExists){
    return res.status(400).json({error: "Customer already exists!"})
  }

  customers.push({cpf, name, id: uuidv4(), statement: []})

  return res.status(201).send()
})

//2 - Buscando o extrato bancário do cliente
app.get('/statements', (req, res) => {
  const {cpf} = req.headers

  //Buscando o cliente existente
  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return res.status(404).json({error: "Customer not found"})
  }

  return res.json(customer.statement)
})

app.listen(3000, () => console.log('Server is running...'))