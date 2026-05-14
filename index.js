const express = require('express')
const app = express()

app.use(express.json())

let jogadores = []
let banidos = []
let kickados = []

app.get('/salvar', (req, res) => {
    const { player, kills } = req.query
    const index = jogadores.findIndex(j => j.player === player)
    if (index !== -1) {
        jogadores[index].kills = kills
    } else {
        jogadores.push({ player, kills })
    }
    res.send('OK')
})

app.get('/ranking', (req, res) => {
    const ranking = jogadores.sort((a, b) => b.kills - a.kills)
    res.json(ranking)
})

app.get('/banir', (req, res) => {
    const { player } = req.query
    banidos.push(player)
    res.send('BANIDO')
})

app.get('/kickar', (req, res) => {
    const { player } = req.query
    kickados.push(player)
    res.send('KICKADO')
})

app.get('/acoes', (req, res) => {
    const { player } = req.query
    if (banidos.includes(player)) {
        res.send('BAN')
    } else if (kickados.includes(player)) {
        kickados = kickados.filter(k => k !== player)
        res.send('KICK')
    } else {
        res.send('OK')
    }
})

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html')
})

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando!')
})