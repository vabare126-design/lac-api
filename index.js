const express = require('express')
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const ADMIN_PASSWORD = 'admin123'

let jogadores = []
let banidos = []
let kickados = []
let whitelist = []
let logs = []

function addLog(texto) {
    const data = new Date().toLocaleString('pt-BR')
    logs.unshift(`[${data}] ${texto}`)
    if (logs.length > 100) logs.pop()
}

app.get('/', (req, res) => {
    res.redirect('/admin')
})

// Recebe dados do LAC
app.get('/player/update', (req, res) => {
    const {
        player,
        kills = 0,
        role = 'UNKNOWN',
        cash = 0,
        health = 100
    } = req.query

    if (!player) {
        return res.send('PLAYER_MISSING')
    }

    const index = jogadores.findIndex(j => j.player === player)

    const dados = {
        player,
        kills: Number(kills) || 0,
        role,
        cash,
        health,
        lastSeen: new Date().toLocaleString('pt-BR')
    }

    if (index !== -1) {
        jogadores[index] = {
            ...jogadores[index],
            ...dados
        }
    } else {
        jogadores.push(dados)
        addLog(`Novo jogador detectado: ${player}`)
    }

    res.send('OK')
})

// Rota antiga, pra não quebrar tua triggerbox antiga
app.get('/salvar', (req, res) => {
    const { player, kills } = req.query

    if (!player) {
        return res.send('PLAYER_MISSING')
    }

    const index = jogadores.findIndex(j => j.player === player)

    const dados = {
        player,
        kills: Number(kills) || 0,
        role: 'UNKNOWN',
        cash: 0,
        health: 100,
        lastSeen: new Date().toLocaleString('pt-BR')
    }

    if (index !== -1) {
        jogadores[index] = {
            ...jogadores[index],
            ...dados
        }
    } else {
        jogadores.push(dados)
        addLog(`Novo jogador detectado: ${player}`)
    }

    res.send('OK')
})

app.get('/ranking', (req, res) => {
    const ranking = [...jogadores].sort((a, b) => b.kills - a.kills)
    res.json(ranking)
})

app.get('/api/data', (req, res) => {
    res.json({
        jogadores,
        banidos,
        kickados,
        whitelist,
        logs
    })
})

app.get('/api/banir', (req, res) => {
    const { player } = req.query
    if (!player) return res.send('PLAYER_MISSING')

    if (!banidos.includes(player)) {
        banidos.push(player)
        addLog(`Jogador banido pelo painel: ${player}`)
    }

    res.send('BANIDO')
})

app.get('/api/desbanir', (req, res) => {
    const { player } = req.query
    banidos = banidos.filter(p => p !== player)
    addLog(`Jogador removido da banlist: ${player}`)
    res.send('DESBANIDO')
})

app.get('/api/kickar', (req, res) => {
    const { player } = req.query
    if (!player) return res.send('PLAYER_MISSING')

    kickados.push(player)
    addLog(`Jogador marcado para kick: ${player}`)

    res.send('KICKADO')
})

app.get('/api/whitelist/add', (req, res) => {
    const { player } = req.query
    if (!player) return res.send('PLAYER_MISSING')

    if (!whitelist.includes(player)) {
        whitelist.push(player)
        addLog(`Jogador adicionado na whitelist: ${player}`)
    }

    res.send('WHITELIST_ADD')
})

app.get('/api/whitelist/remove', (req, res) => {
    const { player } = req.query
    whitelist = whitelist.filter(p => p !== player)
    addLog(`Jogador removido da whitelist: ${player}`)
    res.send('WHITELIST_REMOVE')
})

// Essa rota o LAC pode consultar, mas talvez ele só mostre a resposta no chat
app.get('/acoes', (req, res) => {
    const { player } = req.query

    if (banidos.includes(player)) {
        return res.send('BAN')
    }

    if (kickados.includes(player)) {
        kickados = kickados.filter(p => p !== player)
        return res.send('KICK')
    }

    res.send('OK')
})

app.get('/admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Painel ADM RP Brasil</title>
    <style>
        body {
            background: #0f172a;
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
        }

        h1 {
            color: #38bdf8;
            text-align: center;
        }

        .login, .painel {
            max-width: 1100px;
            margin: auto;
        }

        input {
            padding: 10px;
            border-radius: 6px;
            border: none;
            margin: 5px;
        }

        button {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin: 3px;
            color: white;
            font-weight: bold;
        }

        .btn-login { background: #2563eb; }
        .btn-ban { background: #dc2626; }
        .btn-kick { background: #f97316; }
        .btn-white { background: #16a34a; }
        .btn-remove { background: #64748b; }
        .btn-copy { background: #7c3aed; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: #1e293b;
            border-radius: 8px;
            overflow: hidden;
        }

        th, td {
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #334155;
        }

        th {
            background: #020617;
            color: #38bdf8;
        }

        .card {
            background: #1e293b;
            padding: 15px;
            margin-top: 15px;
            border-radius: 10px;
        }

        textarea {
            width: 100%;
            height: 160px;
            background: #020617;
            color: #22c55e;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 10px;
        }

        .log {
            background: #020617;
            padding: 10px;
            border-radius: 8px;
            max-height: 180px;
            overflow: auto;
            color: #cbd5e1;
        }
    </style>
</head>
<body>
    <h1>🛡️ Painel ADM RP Brasil</h1>

    <div class="login" id="login">
        <div class="card">
            <h2>Entrar no painel</h2>
            <input id="senha" type="password" placeholder="Senha ADM">
            <button class="btn-login" onclick="entrar()">Entrar</button>
            <p>Senha padrão: <b>admin123</b></p>
        </div>
    </div>

    <div class="painel" id="painel" style="display:none;">
        <div class="card">
            <h2>Jogadores detectados</h2>
            <table>
                <thead>
                    <tr>
                        <th>Jogador</th>
                        <th>Kills</th>
                        <th>Role</th>
                        <th>Cash</th>
                        <th>Vida</th>
                        <th>Última vez</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="players"></tbody>
            </table>
        </div>

        <div class="card">
            <h2>Adicionar jogador manualmente</h2>
            <input id="manualPlayer" placeholder="Nome do jogador">
            <button class="btn-ban" onclick="banirManual()">Banir</button>
            <button class="btn-white" onclick="whitelistManual()">Whitelist</button>
        </div>

        <div class="card">
            <h2>Banlist</h2>
            <div id="banlist"></div>
        </div>

        <div class="card">
            <h2>Whitelist</h2>
            <div id="whitelist"></div>
        </div>

        <div class="card">
            <h2>Triggerbox para enviar dados pro painel</h2>
            <textarea id="triggerUpdate" readonly>mode{loop}
cooldown{20}
webrequest{https://web-production-edfc0.up.railway.app/player/update?player=[playername]&kills=[killcount]&role=[role]&cash=[cash]&health=[health]*GET}</textarea>
            <button class="btn-copy" onclick="copiar('triggerUpdate')">Copiar</button>
        </div>

        <div class="card">
            <h2>Comandos de ban gerados</h2>
            <textarea id="banCommands" readonly></textarea>
            <button class="btn-copy" onclick="copiar('banCommands')">Copiar</button>
        </div>

        <div class="card">
            <h2>Logs</h2>
            <div class="log" id="logs"></div>
        </div>
    </div>

<script>
    const SENHA = '${ADMIN_PASSWORD}'

    function entrar() {
        const senha = document.getElementById('senha').value
        if (senha === SENHA) {
            document.getElementById('login').style.display = 'none'
            document.getElementById('painel').style.display = 'block'
            carregar()
            setInterval(carregar, 3000)
        } else {
            alert('Senha errada!')
        }
    }

    async function carregar() {
        const res = await fetch('/api/data')
        const data = await res.json()

        const players = document.getElementById('players')
        players.innerHTML = ''

        data.jogadores.forEach(j => {
            players.innerHTML += \`
                <tr>
                    <td>\${j.player}</td>
                    <td>\${j.kills}</td>
                    <td>\${j.role}</td>
                    <td>\${j.cash}</td>
                    <td>\${j.health}</td>
                    <td>\${j.lastSeen}</td>
                    <td>
                        <button class="btn-kick" onclick="kickar('\${j.player}')">Kick</button>
                        <button class="btn-ban" onclick="banir('\${j.player}')">Ban</button>
                        <button class="btn-white" onclick="addWhitelist('\${j.player}')">Whitelist</button>
                    </td>
                </tr>
            \`
        })

        document.getElementById('banlist').innerHTML = data.banidos.map(p => 
            \`<p>🔨 \${p} <button class="btn-remove" onclick="desbanir('\${p}')">Remover</button></p>\`
        ).join('') || 'Nenhum banido'

        document.getElementById('whitelist').innerHTML = data.whitelist.map(p => 
            \`<p>✅ \${p} <button class="btn-remove" onclick="removeWhitelist('\${p}')">Remover</button></p>\`
        ).join('') || 'Whitelist vazia'

        document.getElementById('logs').innerHTML = data.logs.map(l => 
            \`<div>\${l}</div>\`
        ).join('')

        gerarComandosBan(data.banidos)
    }

    function gerarComandosBan(banidos) {
        if (!banidos.length) {
            document.getElementById('banCommands').value = 'Nenhum jogador banido ainda.'
            return
        }

        let texto = ''

        banidos.forEach(player => {
            texto += \`mode{loop}
ifcondition{playername=\${player}}
kick{Você foi removido do RP BRASIL.}

\`
        })

        document.getElementById('banCommands').value = texto
    }

    async function banir(player) {
        await fetch('/api/banir?player=' + encodeURIComponent(player))
        alert(player + ' foi colocado na banlist.')
        carregar()
    }

    async function desbanir(player) {
        await fetch('/api/desbanir?player=' + encodeURIComponent(player))
        carregar()
    }

    async function kickar(player) {
        await fetch('/api/kickar?player=' + encodeURIComponent(player))
        alert(player + ' foi marcado para kick.')
        carregar()
    }

    async function addWhitelist(player) {
        await fetch('/api/whitelist/add?player=' + encodeURIComponent(player))
        carregar()
    }

    async function removeWhitelist(player) {
        await fetch('/api/whitelist/remove?player=' + encodeURIComponent(player))
        carregar()
    }

    async function banirManual() {
        const player = document.getElementById('manualPlayer').value
        if (!player) return alert('Digite o nome do jogador.')
        await banir(player)
    }

    async function whitelistManual() {
        const player = document.getElementById('manualPlayer').value
        if (!player) return alert('Digite o nome do jogador.')
        await addWhitelist(player)
    }

    function copiar(id) {
        const campo = document.getElementById(id)
        campo.select()
        document.execCommand('copy')
        alert('Copiado!')
    }
</script>
</body>
</html>
    `)
})

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor rodando!')
})