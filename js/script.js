// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


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

// --- SINCRONIZAÇÃO EM TEMPO REAL ---
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        estadoGlobal = data;
        render();
    } else {
        // Se o banco estiver vazio, inicializa
        salvar();
    }
});

function salvar() {
    set(dbRef, estadoGlobal);
}

// --- FUNÇÕES DE LÓGICA ---
function registrar() {
    const n = document.getElementById('selectEquipe').value;
    const r = document.getElementById('selectResultado').value;
    const id = Date.now();
    
    const e = estadoGlobal.equipes.find(x => x.nome === n);
    if(r === 'V') { e.pts += 3; e.v += 1; }
    else if(r === 'E') { e.pts += 1; e.e += 1; }
    else { e.d += 1; }

    estadoGlobal.log.unshift({id, n, r});
    salvar();
}

function anular(id) {
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
}

function liberarMataMata() {
    if (confirm("Finalizar fase de grupos U19?")) {
        estadoGlobal.faseGruposFinalizada = true;
        salvar();
    }
}

function vencer(fase, nome) {
    if (!estadoGlobal.faseGruposFinalizada) return;
    if (nome === "..." || nome.includes("Venc.")) return;

    estadoGlobal.vencedoresMataMata[fase] = nome;
    salvar();
}

// --- RENDERIZAÇÃO ---
function render() {
    const sort = (g) => estadoGlobal.equipes.filter(x => x.grupo === g).sort((a,b) => b.pts - a.pts || b.v - a.v);
    const grupoA = sort("A");
    const grupoB = sort("B");

    // Tabelas
    document.querySelector("#tabelaA tbody").innerHTML = grupoA.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    document.querySelector("#tabelaB tbody").innerHTML = grupoB.map((e,i) => `<tr><td>${i+1}º</td><td>${e.nome}</td><td>${e.pts}</td><td>${e.v}</td></tr>`).join('');
    
    // Histórico (anexando evento dinamicamente)
    const histDiv = document.getElementById('historico');
    histDiv.innerHTML = estadoGlobal.log.map(l => `
        <div class="history-item">
            <span>${l.n} (${l.r})</span>
            <button class="btn-undo" data-id="${l.id}">X</button>
        </div>`).join('');
    
    histDiv.querySelectorAll('.btn-undo').forEach(btn => {
        btn.onclick = () => anular(Number(btn.dataset.id));
    });

    // Mata-mata
    const btnF = document.getElementById('btnFinalizar');
    if(estadoGlobal.faseGruposFinalizada) {
        btnF.disabled = true;
        btnF.innerText = "FASE DE GRUPOS FINALIZADA";
        btnF.style.background = "#6c757d";

        document.getElementById('q1_equipe1').innerText = grupoA[0].nome;
        document.getElementById('q1_equipe2').innerText = grupoB[3].nome;
        document.getElementById('q2_equipe1').innerText = grupoA[1].nome;
        document.getElementById('q2_equipe2').innerText = grupoB[2].nome;
        document.getElementById('q3_equipe1').innerText = grupoA[2].nome;
        document.getElementById('q3_equipe2').innerText = grupoB[1].nome;
        document.getElementById('q4_equipe1').innerText = grupoA[3].nome;
        document.getElementById('q4_equipe2').innerText = grupoB[0].nome;

        // Atualiza vencedores e avanços
        const v = estadoGlobal.vencedoresMataMata;
        if(v.q1) { document.getElementById('semi1_1').innerText = v.q1; destacar('q1', v.q1); }
        if(v.q4) { document.getElementById('semi1_2').innerText = v.q4; destacar('q4', v.q4); }
        if(v.q2) { document.getElementById('semi2_1').innerText = v.q2; destacar('q2', v.q2); }
        if(v.q3) { document.getElementById('semi2_2').innerText = v.q3; destacar('q3', v.q3); }
        if(v.s1) { document.getElementById('final_1').innerText = v.s1; destacar('s1', v.s1); }
        if(v.s2) { document.getElementById('final_2').innerText = v.s2; destacar('s2', v.s2); }
        if(v.f) { 
            document.getElementById('podio').style.display = 'block';
            document.getElementById('campeao_nome').innerText = v.f;
            destacar('f', v.f);
        }
    }
}

function destacar(fase, nome) {
    document.querySelectorAll(`.equipe-btn[data-fase="${fase}"]`).forEach(btn => {
        btn.classList.toggle('venceu', btn.innerText === nome);
    });
}

// --- EVENT LISTENERS (Para módulos JS) ---
document.getElementById('btnRegistrar').onclick = registrar;
document.getElementById('btnFinalizar').onclick = liberarMataMata;
document.getElementById('btnReset').onclick = () => {
    if (confirm("ZERAR TUDO?")) {
        estadoGlobal = {
            equipes: JSON.parse(JSON.stringify(equipesOriginal)),
            log: [],
            faseGruposFinalizada: false,
            vencedoresMataMata: {}
        };
        salvar();
        location.reload();
    }
};

document.querySelectorAll('.equipe-btn').forEach(btn => {
    btn.onclick = () => vencer(btn.dataset.fase, btn.innerText);
});