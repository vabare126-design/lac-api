const express = require('express')
const app = express()

app.use(express.json())

let jogadores = []

app.get('/salvar', (req, res) => {
    const { player, kills } = req.query
    
    const index = jogadores.findIndex(j => j.player === player)
    
    if (index !== -1) {
        jogadores[index].kills = kills
    } else {
        jogadores.push({ player, kills })
    }
    
    console.log(`Jogador: ${player} | Kills: ${kills}`)
    res.send('OK')
})

app.get('/ranking', (req, res) => {
    const ranking = jogadores.sort((a, b) => b.kills - a.kills)
    res.json(ranking)
})

app.listen(3000, () => {
    console.log('Servidor rodando!')
})