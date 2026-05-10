/* 1. CONFIGURAÇÃO FIREBASE */
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

// Inicializa o Firebase no modo compatível (global)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database(); // AGORA O DB ESTÁ DEFINIDO

/* 2. DADOS INICIAIS */
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

let dados = { 
    equipes: JSON.parse(JSON.stringify(equipesOriginal)), 
    log: [], 
    faseGruposFinalizada: false, 
    vencedoresMataMata: {} 
};

/* 3. SINCRONIZAÇÃO COM O BANCO */
db.ref('campeonato_u19').on('value', (snap) => {
    const d = snap.val();
    if (d && d.equipes) { 
        dados = d; 
        render(); 
    } else { 
        // Se o banco estiver vazio, ele cria com os times do U19
        db.ref('campeonato_u19').set(dados); 
    }
});

/* 4. FUNÇÕES DE RENDERIZAÇÃO */
function render() {
    try {
        const trs = (g) => [...dados.equipes].filter(x => x.grupo === g)
            .sort((a,b) => b.pts - a.pts || b.v - a.v)
            .map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td><td>${e.e||0}</td><td>${e.d||0}</td></tr>`).join('');
        
        ["A","B"].forEach(g => { 
            const t = document.querySelector(`#tabela${g} tbody`); 
            if(t) t.innerHTML = trs(g); 
        });
        
        // Renderizar Histórico
        const hist = document.getElementById('historico');
        if (hist) {
            hist.innerHTML = (dados.log || []).map(l => `
                <div class="history-item" style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:5px 10px; margin-bottom:5px; border-radius:4px; border-left:4px solid #e53935; font-size: 14px;">
                    <div style="display: flex; flex-direction: column;"><strong>${l.n}</strong><span style="font-size: 12px; color: #666;">${l.r==='V'?'Vitória':l.r==='E'?'Empate':'Derrota'}</span></div>
                    <button onclick="excluirResultado(${l.id})" class="btn-undo-mini">X</button>
                </div>`).join('');
        }

        // Renderizar Mata-Mata
        const v = dados.vencedoresMataMata || {};
        const ids = ['q1_1','q1_2','q2_1','q2_2','q3_1','q3_2','q4_1','q4_2','s1_1','s1_2','s2_1','s2_2','f1','f2'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (!v[id]) {
                    if(id.startsWith('q')) el.innerText = "..."; 
                    else if(id.startsWith('s')) el.innerText = "Aguardando..."; 
                    else el.innerText = "Finalista";
                    el.classList.remove('venceu');
                } else {
                    el.innerText = v[id];
                    if (v[id+"_win"]) el.classList.add('venceu'); else el.classList.remove('venceu');
                }
            }
        });

        const podio = document.getElementById('podio');
        if (podio) { 
            podio.style.display = v.campeao ? 'block' : 'none'; 
            document.getElementById('campeao_nome').innerText = v.campeao || "---"; 
        }
    } catch(err) { console.error("Erro ao renderizar:", err); }
}

/* 5. AÇÕES (Registrar, Vencer, Reset) */
function registrar() {
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
}

function excluirResultado(id) {
    if (!confirm("Deseja estornar os pontos?")) return;
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
}

function vencer(partida, el) {
    const nome = el.innerText;
    if (!nome || nome === "..." || nome === "Aguardando...") return;
    if (!dados.vencedoresMataMata) dados.vencedoresMataMata = {};
    const chaves = { 'q1':'s1_1', 'q4':'s1_2', 'q2':'s2_1', 'q3':'s2_2', 's1':'f1', 's2':'f2', 'f':'campeao' };
    if (chaves[partida]) {
        dados.vencedoresMataMata[chaves[partida]] = nome;
        dados.vencedoresMataMata[el.id + "_win"] = true;
        const num = el.id.split('_')[1];
        const outroNum = (num === '1') ? '2' : '1';
        let advId = (partida === 'f') ? (el.id === 'f1' ? 'f2' : 'f1') : el.id.split('_')[0] + "_" + outroNum;
        dados.vencedoresMataMata[advId + "_win"] = false;
        db.ref('campeonato_u19').set(dados);
    }
}

function liberarMataMata() {
    if (confirm("Gerar Quartas (4A x 4B)?")) {
        const obter = (g) => [...dados.equipes].filter(e => e.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
        const rA = obter("A"), rB = obter("B");
        dados.vencedoresMataMata = {
            'q1_1': rA[0]?.nome || "...", 'q1_2': rB[3]?.nome || "...",
            'q2_1': rA[1]?.nome || "...", 'q2_2': rB[2]?.nome || "...",
            'q3_1': rB[0]?.nome || "...", 'q3_2': rA[3]?.nome || "...",
            'q4_1': rB[1]?.nome || "...", 'q4_2': rA[2]?.nome || "..."
        };
        dados.faseGruposFinalizada = true;
        db.ref('campeonato_u19').set(dados);
    }
}

window.confirmarReset = function() {
    if (confirm("ZERAR TUDO NO U19?")) {
        db.ref('campeonato_u19').set({ 
            equipes: JSON.parse(JSON.stringify(equipesOriginal)), 
            log: [], 
            faseGruposFinalizada: false, 
            vencedoresMataMata: {} 
        }).then(() => location.reload());
    }
}
