// 1. Configuração do Firebase (U19)
const firebaseConfig = {
  apiKey: "AIzaSyBvn_W7lu81DYof9OHiWd3H_7CbGANHHc8",
  authDomain: "cabo-u19.firebaseapp.com",
  databaseURL: "https://cabo-u19-default-rtdb.firebaseio.com",
  projectId: "cabo-u19",
  storageBucket: "cabo-u19.firebasestorage.app",
  messagingSenderId: "86836160399",
  appId: "1:86836160399:web:8d947d8cb1635279794dfa",
  measurementId: "G-L78YNWK1SD"
};

// Inicialização Global
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const equipesOriginal = [
    { nome: "VIVERTEC", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "MASERATI", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ROBO COC", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "MARVELTEC U-19", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "TECFLOR", grupo: "A", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "FLASHLIGHT", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ROBOHERO", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ROBOTEC-PED", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ARTHEMIS", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "FÚRIA", grupo: "B", pts: 0, v: 0, e: 0, d: 0 },
    { nome: "ENGREBOT", grupo: "B", pts: 0, v: 0, e: 0, d: 0 }
];

let dados = { equipes: JSON.parse(JSON.stringify(equipesOriginal)), log: [], faseGruposFinalizada: false, vencedoresMataMata: {} };

// Sincronização em tempo real
db.ref('campeonato_u19').on('value', (snap) => {
    const d = snap.val();
    if (d && d.equipes) { 
        dados = d; 
        render(); 
    } else { 
        db.ref('campeonato_u19').set(dados); 
    }
});

// FUNÇÕES TORNADAS GLOBAIS (Para os botões funcionarem)
window.registrar = function() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const e = dados.equipes.find(x => x.nome === n);
    if (e) {
        if (r === 'V') { e.pts += 3; e.v += 1; }
        else if (r === 'E') { e.pts += 1; e.e += 1; }
        else { e.d += 1; }
        if (!dados.log) dados.log = [];
        dados.log.unshift({ id: Date.now(), n, r });
        db.ref('campeonato_u19').set(dados);
    }
};

window.vencer = function(partida, el) {
    if (!document.body.dataset.page === 'admin') return;
    const nome = el.innerText;
    if (!nome || nome === "..." || nome === "Aguardando...") return;
    
    if (!dados.vencedoresMataMata) dados.vencedoresMataMata = {};
    const chaves = { 'q1':'s1_1', 'q4':'s1_2', 'q2':'s2_1', 'q3':'s2_2', 's1':'f1', 's2':'f2', 'f':'campeao' };
    
    if (chaves[partida]) {
        dados.vencedoresMataMata[chaves[partida]] = nome;
        dados.vencedoresMataMata[el.id + "_win"] = true;
        
        // Desmarcar o oponente
        const num = el.id.split('_')[1];
        const outroNum = (num === '1') ? '2' : '1';
        const advId = el.id.split('_')[0] + "_" + outroNum;
        dados.vencedoresMataMata[advId + "_win"] = false;
        
        db.ref('campeonato_u19').set(dados);
    }
};

window.liberarMataMata = function() {
    if (confirm("Gerar Quartas (4A x 4B)?")) {
        const obter = (g) => [...dados.equipes].filter(e => e.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
        const rA = obter("A"), rB = obter("B");
        dados.vencedoresMataMata = {
            'q1_1': rA[0]?.nome || "...", 'q1_2': rB[3]?.nome || "...",
            'q2_1': rA[1]?.nome || "...", 'q2_2': rB[2]?.nome || "...",
            'q3_1': rB[0]?.nome || "...", 'q3_2': rA[3]?.nome || "...",
            'q4_1': rB[1]?.nome || "...", 'q4_2': rA[2]?.nome || "..."
        };
        db.ref('campeonato_u19').set(dados);
    }
};

window.confirmarReset = function() {
    if (confirm("ZERAR TUDO NO U19?")) {
        db.ref('campeonato_u19').set({ 
            equipes: JSON.parse(JSON.stringify(equipesOriginal)), 
            log: [], 
            faseGruposFinalizada: false, 
            vencedoresMataMata: {} 
        }).then(() => location.reload());
    }
};

window.excluirResultado = function(id) {
    const idx = dados.log.findIndex(l => l.id === id);
    if (idx === -1) return;
    const item = dados.log[idx];
    const equipe = dados.equipes.find(e => e.nome === item.n);
    if (equipe) {
        if (item.r === 'V') { equipe.pts -= 3; equipe.v -= 1; }
        else if (item.r === 'E') { equipe.pts -= 1; equipe.e -= 1; }
        else { equipe.d -= 1; }
        dados.log.splice(idx, 1);
        db.ref('campeonato_u19').set(dados);
    }
};

function render() {
    try {
        const trs = (g) => [...dados.equipes].filter(x => x.grupo === g)
            .sort((a,b) => b.pts - a.pts || b.v - a.v)
            .map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td><td>${e.e||0}</td><td>${e.d||0}</td></tr>`).join('');
        
        ["A","B"].forEach(g => { 
            const t = document.querySelector(`#tabela${g} tbody`); 
            if(t) t.innerHTML = trs(g); 
        });

        const hist = document.getElementById('historico');
        if (hist) {
            hist.innerHTML = (dados.log || []).map(l => `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; padding:5px; background:#eee;">
                    <span>${l.n} (${l.r})</span>
                    <button onclick="excluirResultado(${l.id})">x</button>
                </div>`).join('');
        }

        const v = dados.vencedoresMataMata || {};
        const ids = ['q1_1','q1_2','q2_1','q2_2','q3_1','q3_2','q4_1','q4_2','s1_1','s1_2','s2_1','s2_2','f1','f2'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = v[id] || (id.startsWith('q') ? "..." : id.startsWith('s') ? "Aguardando..." : "Finalista");
                if (v[id+"_win"]) el.classList.add('venceu'); else el.classList.remove('venceu');
            }
        });

        if (document.getElementById('podio')) {
            document.getElementById('podio').style.display = v.campeao ? 'block' : 'none';
            document.getElementById('campeao_nome').innerText = v.campeao || "---";
        }
    } catch(e) { console.log(e); }
}

window.verificarLogin = function() {
    const usuarioCorreto = "admin"; // Escolha o usuário aqui
    const senhaCorreta = "fira1910";  // Escolha a senha aqui

    const u = document.getElementById('user').value;
    const p = document.getElementById('pass').value;

    if (u === usuarioCorreto && p === senhaCorreta) {
        // Esconde a tela de login e libera a página
        document.getElementById('loginGate').style.display = 'none';
        // Opcional: Salva no navegador que já logou para não pedir de novo nesta sessão
        sessionStorage.setItem('logado', 'true');
    } else {
        document.getElementById('erroLogin').style.display = 'block';
    }
};

// Verificar se já logou anteriormente nesta sessão ao carregar a página
window.addEventListener('load', () => {
    if (sessionStorage.getItem('logado') === 'true') {
        const gate = document.getElementById('loginGate');
        if (gate) gate.style.display = 'none';
    }
});
