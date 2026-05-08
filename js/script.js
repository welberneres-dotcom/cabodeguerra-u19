import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database"; // Certifique-se que onValue está aqui

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

// Inicializa o estadoGlobal com os dados originais para não ficar vazio
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
        // Se o banco estiver vazio, ele salva os dados iniciais e renderiza
        salvar();
        render(); 
    }
});

function salvar() { set(dbRef, estadoGlobal); }

function render() {
    const sort = (g) => estadoGlobal.equipes.filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
    const grupoA = sort("A");
    const grupoB = sort("B");

    const templateRow = (e, i) => `
        <tr>
            <td>${i+1}º</td>
            <td style="text-align: left; padding-left: 15px;">${e.nome}</td>
            <td>${e.pts}</td>
            <td>${e.v}</td>
        </tr>`;

    document.querySelector("#tabelaA tbody").innerHTML = grupoA.map(templateRow).join('');
    document.querySelector("#tabelaB tbody").innerHTML = grupoB.map(templateRow).join('');

    const histDiv = document.getElementById('historico');
    if(histDiv) {
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
                    if(item.r === 'V') { e.pts -= 3; e.v -= 1; }
                    else if(item.r === 'E') { e.pts -= 1; e.e -= 1; }
                    else { e.d -= 1; }
                    estadoGlobal.log.splice(i, 1);
                    salvar();
                }
            };
        });
    }

    const btnF = document.getElementById('btnFinalizar');
    if(estadoGlobal.faseGruposFinalizada) {
        if(btnF) {
            btnF.disabled = true;
            btnF.innerText = "FASE DE GRUPOS FINALIZADA";
            btnF.style.background = "#6c757d";
        }

        const atualizarPar = (id1, id2, eq1, eq2) => {
            document.getElementById(id1).innerText = eq1;
            document.getElementById(id2).innerText = eq2;
        };

        atualizarPar('q1_equipe1', 'q1_equipe2', grupoA[0].nome, grupoB[3].nome);
        atualizarPar('q2_equipe1', 'q2_equipe2', grupoA[1].nome, grupoB[2].nome);
        atualizarPar('q3_equipe1', 'q3_equipe2', grupoA[2].nome, grupoB[1].nome);
        atualizarPar('q4_equipe1', 'q4_equipe2', grupoA[3].nome, grupoB[0].nome);

        const v = estadoGlobal.vencedoresMataMata;
        const pts = [
            {f:'q1', s:'semi1_1'}, {f:'q4', s:'semi1_2'},
            {f:'q2', s:'semi2_1'}, {f:'q3', s:'semi2_2'},
            {f:'s1', s:'final_1'}, {f:'s2', s:'final_2'}
        ];

        pts.forEach(p => {
            if(v[p.f]) {
                document.getElementById(p.s).innerText = v[p.f];
                destacar(p.f, v[p.f]);
            }
        });

        if(v.f) {
            document.getElementById('podio').style.display = 'block';
            document.getElementById('campeao_nome').innerText = v.f;
            destacar('f', v.f);
        }
    }
}

function destacar(fase, nome) {
    document.querySelectorAll(`[data-fase="${fase}"]`).forEach(el => {
        el.classList.toggle('venceu', el.innerText === nome);
    });
}

if(document.getElementById('btnRegistrar')) {
    document.getElementById('btnRegistrar').onclick = () => {
        const n = document.getElementById('selectEquipe').value;
        const r = document.getElementById('selectResultado').value;
        const e = estadoGlobal.equipes.find(x => x.nome === n);
        if(r === 'V') { e.pts += 3; e.v += 1; }
        else if(r === 'E') { e.pts += 1; e.e += 1; }
        else { e.d += 1; }
        estadoGlobal.log.unshift({id: Date.now(), n, r});
        salvar();
    };
}

if(document.getElementById('btnFinalizar')) {
    document.getElementById('btnFinalizar').onclick = () => {
        if (confirm("Finalizar fase de grupos U19?")) {
            estadoGlobal.faseGruposFinalizada = true;
            salvar();
        }
    };
}

document.querySelectorAll('.equipe-btn').forEach(btn => {
    btn.onclick = () => {
        if (!estadoGlobal.faseGruposFinalizada) return;
        const nome = btn.innerText;
        if (nome === "..." || nome.includes("Venc.")) return;
        estadoGlobal.vencedoresMataMata[btn.dataset.fase] = nome;
        salvar();
    };
});

if(document.getElementById('btnReset')) {
    document.getElementById('btnReset').onclick = () => {
        if (confirm("ZERAR TUDO?")) {
            estadoGlobal = {
                equipes: JSON.parse(JSON.stringify(equipesOriginal)),
                log: [], faseGruposFinalizada: false, vencedoresMataMata: {}
            };
            salvar();
            location.reload();
        }
    };
}
