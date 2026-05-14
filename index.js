const express = require('express')
const path = require('path')
const app = express()

app.use(express.json())

const ADMIN_PASSWORD = '122'

let jogadores = {}        // { nome: { player, kills, lastSeen } }
let banidos = []          // ['nome1', 'nome2']
let pendingActions = {}   // { nome: ['HEAL', 'CASH_1000'] }
let globalActions = []    // ações pra todos os players

// ===== HEARTBEAT (jogador chama a cada 2s) =====
app.get('/heartbeat', (req, res) => {
    const { player, kills } = req.query
    if (!player) return res.send('NONE')

    jogadores[player] = {
        player,
        kills: kills || '0',
        lastSeen: Date.now()
    }

    if (banidos.includes(player)) return res.send('BAN')

    // Ação global tem prioridade
    if (globalActions.length > 0) {
        const action = globalActions.shift()
        return res.send(action)
    }

    if (pendingActions[player] && pendingActions[player].length > 0) {
        const action = pendingActions[player].shift()
        return res.send(action)
    }

    res.send('NONE')
})

// Compatibilidade com o triggerbox antigo
app.get('/salvar', (req, res) => {
    const { player, kills } = req.query
    if (player) {
        jogadores[player] = { player, kills: kills || '0', lastSeen: Date.now() }
    }
    res.send('OK')
})

app.get('/ranking', (req, res) => {
    const lista = Object.values(jogadores)
        .map(j => ({ player: j.player, kills: j.kills }))
        .sort((a, b) => parseInt(b.kills) - parseInt(a.kills))
    res.json(lista)
})

// ===== API ADMIN =====
function checkAuth(req, res, next) {
    const pass = req.body.pass || req.query.pass
    if (pass !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta' })
    next()
}

app.post('/api/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) res.json({ success: true })
    else res.status(401).json({ success: false })
})

app.get('/api/players', (req, res) => {
    if (req.query.pass !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Não autorizado' })
    const agora = Date.now()
    const online = Object.values(jogadores)
        .filter(j => agora - j.lastSeen < 30000)
        .map(j => ({
            player: j.player,
            kills: j.kills,
            isBanned: banidos.includes(j.player),
            pendingCount: (pendingActions[j.player] || []).length
        }))
        .sort((a, b) => a.player.localeCompare(b.player))
    res.json(online)
})

app.post('/api/action', checkAuth, (req, res) => {
    const { player, action } = req.body
    if (!player || !action) return res.status(400).json({ error: 'faltam dados' })

    if (!pendingActions[player]) pendingActions[player] = []
    pendingActions[player].push(action)

    if (action === 'BAN' && !banidos.includes(player)) banidos.push(player)

    res.json({ success: true, queued: action })
})

app.post('/api/global', checkAuth, (req, res) => {
    const { action } = req.body
    if (!action) return res.status(400).json({ error: 'faltam dados' })
    globalActions.push(action)
    res.json({ success: true })
})

app.post('/api/unban', checkAuth, (req, res) => {
    banidos = banidos.filter(p => p !== req.body.player)
    res.json({ success: true })
})

app.post('/api/clear', checkAuth, (req, res) => {
    if (req.body.player) pendingActions[req.body.player] = []
    res.json({ success: true })
})

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')))

// Limpa jogadores offline
setInterval(() => {
    const agora = Date.now()
    Object.keys(jogadores).forEach(p => {
        if (agora - jogadores[p].lastSeen > 60000) delete jogadores[p]
    })
}, 30000)

app.listen(process.env.PORT || 3000, () => console.log('Servidor rodando!'))