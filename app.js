let timeoutSimulacao = null;

// 🔥 CARREGA MODALIDADES AUTOMATICAMENTE
async function carregarModalidades() {
  const tipo = document.getElementById("tipo").value;
  const select = document.getElementById("modalidade");

  // limpa antes
  select.innerHTML = '<option value="">Selecione</option>';

  let dados = [];

  // 🔵 LINK
  if (tipo === "link") {
    const { data, error } = await supabaseClient
      .from("taxas_link")
      .select("modalidade");

    console.log("🔵 LINK dados recebidos:", data);

    if (!error && data) {
      dados = data;
    }
  }

  // 🟣 MAQUININHA
  if (tipo === "maquininha") {
    const { data, error } = await supabaseClient
      .from("taxas_maquininha")
      .select("modalidade");

    console.log("🟣 MAQUININHA dados recebidos:", data);

    if (!error && data) {
      dados = data;
    }
  }

  // 🔁 evita erro se vier vazio
  if (!dados || dados.length === 0) {
    console.warn("⚠️ Nenhuma modalidade encontrada");
    return;
  }

  // 🔁 remove duplicados
  const unicos = [...new Set(dados.map((d) => d.modalidade))];

  // 🔁 preenche select
  unicos.forEach((mod) => {
    const option = document.createElement("option");
    option.value = mod;
    option.textContent = mod;
    select.appendChild(option);
  });
}

// 🔥 CARREGA AO ABRIR
window.onload = function () {
  carregarModalidades();
};
// 🔥 SIMULAR
async function simular() {
  const valorInput = document.getElementById("valor_real").value;
  const tipo = document.getElementById("tipo").value;
  const modalidade = document.getElementById("modalidade").value;
  const bandeira = document.getElementById("bandeira").value;
  const modo = document.getElementById("modo").value;

  if (!valorInput || !tipo || !modalidade || !modo) {
    alert("Preencha todos os campos");
    return;
  }

  const valor = parseFloat(valorInput);

  let taxa = 0;

  // 🔎 BUSCA TAXA NO BANCO
  if (tipo === "link") {
    const { data, error } = await supabaseClient
      .from("taxas_link")
      .select("taxa")
      .eq("modalidade", modalidade)
      .single();

    if (error || !data) {
      alert("Erro ao buscar taxa");
      return;
    }

    taxa = data.taxa;
  }

  if (tipo === "maquininha") {
    const { data, error } = await supabaseClient
      .from("taxas_maquininha")
      .select("taxa")
      .eq("modalidade", modalidade)
      .eq("bandeira", bandeira.toLowerCase())
      .single();

    if (error || !data) {
      alert("Erro ao buscar taxa");
      return;
    }

    taxa = data.taxa;
  }

  // 🔢 CALCULO
  let valorLiquido = 0;
  let valorBruto = 0;
  let valorTaxa = 0;

  const taxaDecimal = taxa / 100;

  if (modo === "paga") {
    valorTaxa = valor * taxaDecimal;
    valorLiquido = valor - valorTaxa;
  }

  if (modo === "repassa") {
    let bruto = valor / ((100 - taxa) / 100);

    valorBruto = Math.ceil(bruto * 100) / 100;

    valorTaxa = valorBruto - valor;
    valorLiquido = valor;
  }

  // 🎯 MOSTRAR RESULTADO
  mostrarResultado({
    valor,
    taxa,
    valorTaxa,
    valorLiquido,
    valorBruto,
    modo,
  });
}
function formatarMoeda(v) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function mostrarResultado(res) {
  const div = document.getElementById("resultado");

  let html = "";

  if (res.modo === "paga") {
    html = `
      <div class="card-resultado">
        <p>💰 Valor informado: <strong>${formatarMoeda(res.valor)}</strong></p>
        <p>📊 Taxa: <strong>${res.taxa}%</strong></p>
        <p>💸 Taxa cobrada: <strong>${formatarMoeda(res.valorTaxa)}</strong></p>
        <p>✅ Você recebe: <strong>${formatarMoeda(res.valorLiquido)}</strong></p>
      </div>
    `;
  }

  if (res.modo === "repassa") {
    html = `
      <div class="card-resultado">
        <p>💰 Valor desejado: <strong>${formatarMoeda(res.valor)}</strong></p>
        <p>📊 Taxa: <strong>${res.taxa}%</strong></p>
        <p>💸 Taxa cobrada: <strong>${formatarMoeda(res.valorTaxa)}</strong></p>
        <p>🚀 Cobrar do cliente: <strong>${formatarMoeda(res.valorBruto)}</strong></p>
      </div>
    `;
  }

  div.innerHTML = html;
}

// 🔥 MÁSCARA DE VALOR (PADRÃO SCFP)
function formatarValor(input) {
  let valor = input.value.replace(/\D/g, "");

  if (valor === "") {
    document.getElementById("valor_real").value = "";
    return;
  }

  valor = (parseFloat(valor) / 100).toFixed(2);

  input.value = Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  });

  document.getElementById("valor_real").value = valor;
}
// 🔥 LIMPA RESULTADO
function limparResultado() {
  document.getElementById("resultado").innerHTML = "";
}
// 🔥 RECÁLCULO AUTOMÁTICO (INTELIGENTE)
function recalcularAutomatico() {
  limparResultado();

  if (timeoutSimulacao) {
    clearTimeout(timeoutSimulacao);
  }

  timeoutSimulacao = setTimeout(() => {
    const valor = document.getElementById("valor_real").value;
    const tipo = document.getElementById("tipo").value;
    const modalidade = document.getElementById("modalidade").value;
    const modo = document.getElementById("modo").value;

    // 🔥 SÓ EXECUTA SE TUDO ESTIVER PREENCHIDO
    if (valor && tipo && modalidade && modo) {
      simular();
    }
  }, 600);
}
// 🔥 NAVEGAÇÃO COM ENTER (UX PROFISSIONAL)
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();

    const campos = ["valor_visivel", "tipo", "modalidade", "bandeira", "modo"];

    const atual = document.activeElement.id;
    const index = campos.indexOf(atual);

    if (index > -1 && index < campos.length - 1) {
      // 👉 vai para o próximo campo
      const proximo = document.getElementById(campos[index + 1]);
      if (proximo) proximo.focus();
    } else {
      // 👉 último campo → simula
      simular();
    }
  }
});
