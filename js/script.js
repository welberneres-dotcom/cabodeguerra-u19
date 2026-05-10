import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBvn_W7lu81DYof9OHiWd3H_7CbGANHHc8",
  authDomain: "cabo-u19.firebaseapp.com",
  databaseURL: "https://cabo-u19-default-rtdb.firebaseio.com",
  projectId: "cabo-u19",
  storageBucket: "cabo-u19.firebasestorage.app",
  messagingSenderId: "86836160399",
  appId: "1:86836160399:web:8d947d8cb1635279794dfa"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db, 'campeonatoU19');

// --- DADOS INICIAIS ---
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

let estadoGlobal = {
    equipes: JSON.parse(JSON.stringify(equipesOriginal)),
    log: [],
    faseGruposFinalizada: false,
    vencedoresMataMata: {}
};

// --- SINCRONIZAÇÃO ---
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.equipes) {
        estadoGlobal = data;
        render();
    } else {
        // Força a criação inicial se o banco estiver vazio
        salvar(); 
    }
});

function salvar() { set(dbRef, estadoGlobal); }

function render() {
    // Verifica se as equipes existem antes de filtrar
    if (!estadoGlobal.equipes) return;

    const sort = (g) => estadoGlobal.equipes
        .filter(x => x.grupo === g)
        .sort((a,b) => b.pts - a.pts || b.v - a.v);

    const grupoA = sort("A");
    const grupoB = sort("B");

    const templateRow = (e, i) => `
        <tr>
            <td>${i+1}º</td>
            <td style="text-align: left; padding-left: 15px;">${e.nome}</td>
            <td>${e.pts}</td>
            <td>${e.v}</td>
        </tr>`;

    // Renderiza Tabelas
    const tabA = document.querySelector("#tabelaA tbody");
    const tabB = document.querySelector("#tabelaB tbody");
    if(tabA) tabA.innerHTML = grupoA.map(templateRow).join('');
    if(tabB) tabB.innerHTML = grupoB.map(templateRow).join('');

    // Renderiza Histórico
    const histDiv = document.getElementById('historico');
    if(histDiv && estadoGlobal.log) {
        histDiv.innerHTML = estadoGlobal.log.map(l => `
            <div class="history-item">
                <span>${l.n} (${l.r})</span>
                <button class="btn-undo" data-id="${l.id}">X</button>
            </div>`).join('');
        
        histDiv.querySelectorAll('.btn-undo').forEach(btn => {
            btn.onclick = () => {
                const id = Number(btn.dataset.id);
                const i = estadoGlobal.log.findIndex(x => x.id === id);
                if(i > -1) {
                    const item = estadoGlobal.log[i];
                    const e = estadoGlobal.equipes.find(x => x.nome === item.n);
                    if(e) {
                        if(item.r === 'V') { e.pts -= 3; e.v -= 1; }
                        else if(item.r === 'E') { e.pts -= 1; e.e -= 1; }
                        else { e.d -= 1; }
                        estadoGlobal.log.splice(i, 1);
                        salvar();
                    }
                }
            };
        });
    }

    // Lógica do Mata-Mata
    if(estadoGlobal.faseGruposFinalizada) {
        const btnF = document.getElementById('btnFinalizar');
        if(btnF) {
            btnF.disabled = true;
            btnF.innerText = "GRUPOS FINALIZADOS";
            btnF.style.background = "#6c757d";
        }

        const atualizarPar = (id1, id2, eq1, eq2) => {
            const el1 = document.getElementById(id1);
            const el2 = document.getElementById(id2);
            if(el1 && eq1) el1.innerText = eq1;
            if(el2 && eq2) el2.innerText = eq2;
        };

        // Chaveamento 4A x 4B
        if(grupoA.length >= 4 && grupoB.length >= 4) {
            atualizarPar('q1_equipe1', 'q1_equipe2', grupoA[0].nome, grupoB[3].nome);
            atualizarPar('q2_equipe1', 'q2_equipe2', grupoA[1].nome, grupoB[2].nome);
            atualizarPar('q3_equipe1', 'q3_equipe2', grupoA[2].nome, grupoB[1].nome);
            atualizarPar('q4_equipe1', 'q4_equipe2', grupoA[3].nome, grupoB[0].nome);
        }

        const v = estadoGlobal.vencedoresMataMata || {};
        const caminhos = [
            {f:'q1', s:'semi1_1'}, {f:'q4', s:'semi1_2'},
            {f:'q2', s:'semi2_1'}, {f:'q3', s:'semi2_2'},
            {f:'s1', s:'final_1'}, {f:'s2', s:'final_2'}
        ];

        caminhos.forEach(p => {
            if(v[p.f]) {
                const destino = document.getElementById(p.s);
                if(destino) destino.innerText = v[p.f];
                destacar(p.f, v[p.f]);
            }
        });

        if(v.f) {
            const p = document.getElementById('podio');
            if(p) p.style.display = 'block';
            const c = document.getElementById('campeao_nome');
            if(c) c.innerText = v.f;
            destacar('f', v.f);
        }
    }
}

// Funções de Destaque e Eventos permanecem as mesmas...
function destacar(fase, nome) {
    document.querySelectorAll(`[data-fase="${fase}"]`).forEach(el => {
        el.classList.toggle('venceu', el.innerText === nome);
    });
}

// Registrar Pontos
const btnReg = document.getElementById('btnRegistrar');
if(btnReg) {
    btnReg.onclick = () => {
        const n = document.getElementById('selectEquipe').value;
        const r = document.getElementById('selectResultado').value;
        const e = estadoGlobal.equipes.find(x => x.nome === n);
        if(e) {
            if(r === 'V') { e.pts += 3; e.v += 1; }
            else if(r === 'E') { e.pts += 1; e.e += 1; }
            else { e.d += 1; }
            if(!estadoGlobal.log) estadoGlobal.log = [];
            estadoGlobal.log.unshift({id: Date.now(), n, r});
            salvar();
        }
    };
}

// Finalizar Grupos
const btnFin = document.getElementById('btnFinalizar');
if(btnFin) {
    btnFin.onclick = () => {
        if (confirm("Finalizar fase de grupos U19?")) {
            estadoGlobal.faseGruposFinalizada = true;
            salvar();
        }
    };
}

// Clique no Mata-Mata
document.querySelectorAll('.equipe-btn').forEach(btn => {
    btn.onclick = () => {
        if (!estadoGlobal.faseGruposFinalizada) return;
        const nome = btn.innerText;
        if (nome === "..." || nome.includes("Venc.")) return;
        if (!estadoGlobal.vencedoresMataMata) estadoGlobal.vencedoresMataMata = {};
        estadoGlobal.vencedoresMataMata[btn.dataset.fase] = nome;
        salvar();
    };
});

// Reset
const btnRes = document.getElementById('btnReset');
if(btnRes) {
    btnRes.onclick = () => {
        if (confirm("ZERAR TUDO?")) {
            estadoGlobal = {
                equipes: JSON.parse(JSON.stringify(equipesOriginal)),
                log: [], faseGruposFinalizada: false, vencedoresMataMata: {}
            };
            salvar();
            setTimeout(() => location.reload(), 500);
        }
    };
}
