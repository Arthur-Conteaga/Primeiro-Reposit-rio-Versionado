document.getElementById('year').textContent = new Date().getFullYear();

  /* =======================================================================
     PAINEL DE CONTROLE DO SITE — configure aqui sem mexer no resto do código
     ======================================================================= */

  /* Lista de serviços oferecidos: nome + preço.
     Essa lista alimenta automaticamente 2 lugares do site:
     1) O formulário de agendamento (onde a cliente escolhe os serviços)
     2) A seção "Sobre" (lista de especialidades e preços)
     Pra adicionar/remover/editar um serviço, é só editar esta lista abaixo. */
  let SERVICES = [
    { name: 'Manicure simples', price: 20 },
    { name: 'Manicure em gel', price: 40 },
    { name: 'Pedicure spa dos pés', price: 45 },
    { name: 'Alongamento em gel', price: 90 },
    { name: 'Nail art personalizada', price: 10 },
    { name: 'Manutenção', price: 35 }
  ];

  /* E-mail da manicure que vai receber os pedidos em PDF.
     IMPORTANTE: troque pelo e-mail real. No primeiro pedido enviado,
     o FormSubmit manda um e-mail de confirmação — é só clicar em "confirmar" uma vez. */
  /* E-mails que vão receber os pedidos em PDF.
     Pode ser 1 ou vários — o código abaixo envia uma cópia pra cada um da lista.
     IMPORTANTE: cada e-mail novo precisa confirmar UMA VEZ com o FormSubmit
     (assim que o primeiro pedido for enviado, chega um e-mail de confirmação
     pra cada endereço listado aqui — é só clicar em "confirmar" em cada um). */
  const MANICURE_EMAILS = [
    'gabriele.ramalhoa@gmail.com',
    'alcelarthursantos@gmail.com'
  ];

  // Função auxiliar: transforma um número em texto de preço em reais.
  // Exemplo: brl(20) vira "R$ 20,00"
  const brl = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

  /* ---------- Renderiza lista de serviços no formulário ----------
     Essa função "desenha" a lista de serviços na tela toda vez que é chamada:
     lê o array SERVICES (lá de cima) e cria um bloco clicável pra cada um. */
  function renderServices(){
    const list = document.getElementById('services-list');
    list.innerHTML = '';
    SERVICES.forEach((s, i) => {
      const row = document.createElement('label');
      row.className = 'service-item';
      row.innerHTML = `
        <span class="s-name"><input type="checkbox" data-idx="${i}"> ${s.name}</span>
        <span class="s-price">${brl(s.price)}</span>`;
      row.querySelector('input').addEventListener('change', (e) => {
        row.classList.toggle('checked', e.target.checked);
        updateTotal();
      });
      list.appendChild(row);
    });

    const about = document.getElementById('about-specialties');
    if (about){
      about.innerHTML = SERVICES.map(s =>
        `<li><span>${s.name}</span><span>${brl(s.price)}</span></li>`).join('');
    }
  }

  // Soma o preço de todos os serviços marcados (checkbox ligado) e atualiza
  // o texto "Total estimado" na tela.
  function updateTotal(){
    const boxes = document.querySelectorAll('#services-list input[type=checkbox]:checked');
    let total = 0;
    boxes.forEach(b => total += SERVICES[b.dataset.idx].price);
    document.getElementById('total-price').textContent = brl(total);
  }

  // Retorna a lista de serviços que a cliente marcou no formulário
  // (usada tanto para calcular o total quanto para montar o PDF).
  function getSelectedServices(){
    const boxes = document.querySelectorAll('#services-list input[type=checkbox]:checked');
    return Array.from(boxes).map(b => SERVICES[b.dataset.idx]);
  }

  /* ---------- Abrir/fechar o formulário de agendamento (modal) ---------- */
  function openBookingModal(){
    document.getElementById('booking-modal').classList.add('open');
  }
  function closeBookingModal(){
    document.getElementById('booking-modal').classList.remove('open');
  }

  // Mostra uma mensagem colorida abaixo do botão "Enviar" (sucesso, erro ou carregando)
  function showMsg(text, type){
    const el = document.getElementById('form-msg');
    el.textContent = text;
    el.className = 'form-msg show ' + type;
  }

  /* =======================================================================
     FUNÇÃO PRINCIPAL: roda quando a cliente clica em "Enviar pedido"
     Passo a passo: valida os campos → gera o número do pedido → monta o PDF
     → tenta enviar por e-mail → baixa uma cópia do PDF pra cliente também
     ======================================================================= */
  async function submitBooking(){
    // 1) Lê tudo que a cliente preencheu no formulário
    const nome = document.getElementById('c-nome').value.trim();
    const tel = document.getElementById('c-tel').value.trim();
    const data = document.getElementById('c-data').value;
    const hora = document.getElementById('c-hora').value;
    const obs = document.getElementById('c-obs').value.trim();
    const selecionados = getSelectedServices();

    // 2) Validação simples: nome, whatsapp e pelo menos 1 serviço são obrigatórios
    if (!nome || !tel){
      showMsg('Preencha nome e WhatsApp.', 'err');
      return;
    }
    if (selecionados.length === 0){
      showMsg('Escolha pelo menos um serviço.', 'err');
      return;
    }

    // 3) Trava o botão pra evitar clique duplo e avisa que está processando
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    showMsg('Gerando seu pedido...', 'loading');

    const total = selecionados.reduce((s, i) => s + i.price, 0);

    /* 4) Número do pedido: como o site não tem banco de dados, geramos um número
       único a partir da data/hora exata do envio (ano+mês+dia+hora+minuto+segundo). */
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const orderNumber = '' + now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate())
      + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const dataFormatada = now.toLocaleDateString('pt-BR');
    const horaFormatada = now.toLocaleTimeString('pt-BR');

    /* 5) Gera o PDF usando a biblioteca jsPDF (importada no <head> do site).
       Cada doc.text(texto, x, y) escreve uma linha na posição x,y da página. */
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Pedido de agendamento', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Pedido nº: ' + orderNumber, 14, 27);
    doc.text('Data do pedido: ' + dataFormatada + ' às ' + horaFormatada, 14, 33);

    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.text('Nome: ' + nome, 14, 53);
    doc.text('WhatsApp: ' + tel, 14, 59);
    doc.text('Data preferida do atendimento: ' + (data || 'não informada'), 14, 65);
    doc.text('Horário preferido: ' + (hora || 'não informado'), 14, 71);

    doc.setFont('helvetica', 'bold');
    doc.text('Serviços selecionados', 14, 84);
    doc.setFont('helvetica', 'normal');
    let y = 91;
    selecionados.forEach(s => {
      doc.text(s.name + '  -  ' + brl(s.price), 14, y);
      y += 6;
    });

    doc.setFont('helvetica', 'bold');
    doc.text('Total estimado: ' + brl(total), 14, y + 6);

    if (obs){
      doc.setFont('helvetica', 'bold');
      doc.text('Observações', 14, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(obs, 180), 14, y + 25);
    }

    const pdfBlob = doc.output('blob');
    const fileName = 'pedido-' + orderNumber + '-' + nome.replace(/\s+/g,'-').toLowerCase() + '.pdf';

    /* ---- Tenta enviar por e-mail com o PDF anexado (via FormSubmit) ----
       FormSubmit é um serviço gratuito que recebe esses dados e o PDF e
       encaminha por e-mail, sem precisar de servidor próprio.
       Enviamos uma cópia para CADA e-mail da lista MANICURE_EMAILS. */
    let emailOk = false;
    for (const destinatario of MANICURE_EMAILS){
      try {
        // Monta os dados do formulário, incluindo o PDF como anexo (attachment)
        const formData = new FormData();
        formData.append('_subject', 'Pedido nº ' + orderNumber + ' - ' + nome);
        formData.append('numero_do_pedido', orderNumber);
        formData.append('data_do_pedido', dataFormatada + ' às ' + horaFormatada);
        formData.append('nome', nome);
        formData.append('whatsapp', tel);
        formData.append('data_preferida', data || 'não informada');
        formData.append('horario_preferido', hora || 'não informado');
        formData.append('servicos', selecionados.map(s => s.name).join(', '));
        formData.append('total', brl(total));
        formData.append('observacoes', obs || '-');
        formData.append('attachment', pdfBlob, fileName);

        // Envia para o endereço de e-mail atual da lista
        const resp = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(destinatario), {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: formData
        });
        // Se pelo menos um envio der certo, consideramos que o pedido "chegou"
        if (resp.ok) emailOk = true;
      } catch (e){
        // Se der erro de rede/CORS com esse e-mail, seguimos tentando os outros
      }
    }

    /* 6) Sempre baixa uma cópia do PDF no aparelho da própria cliente também,
       como um "comprovante" — mesmo se o e-mail tiver dado certo. */
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    // 7) Libera o botão de novo e mostra o resultado final pra cliente
    btn.disabled = false;

    if (emailOk){
      showMsg('Pedido nº ' + orderNumber + ' enviado! A profissional vai confirmar em breve pelo WhatsApp.', 'ok');
    } else {
      showMsg('Não deu pra confirmar o envio automático agora — mas seu PDF (pedido nº ' + orderNumber + ') foi baixado. Você pode enviar por WhatsApp ou e-mail junto com sua mensagem.', 'err');
    }
  }

  /* =======================================================================
     PAINEL DA PROFISSIONAL — gerenciar serviços (só aparece com ?admin=1 na URL)
     Lembrete: mudanças aqui só valem nesta sessão do navegador. Pra ficar
     permanente, use o botão "Copiar código atualizado" e cole no lugar do
     array SERVICES lá em cima (ou peça pra atualizar o arquivo do site).
     ======================================================================= */

  // Desenha a lista de serviços dentro do painel, cada um com botão "remover"
  function renderAdminList(){
    const el = document.getElementById('admin-services-list');
    el.innerHTML = SERVICES.map((s, i) => `
      <div class="admin-service-row">
        <span>${s.name} — ${brl(s.price)}</span>
        <button onclick="adminRemoveService(${i})">remover</button>
      </div>`).join('');
  }

  // Roda quando a profissional clica em "Adicionar" no painel
  function adminAddService(){
    const nameEl = document.getElementById('admin-new-name');
    const priceEl = document.getElementById('admin-new-price');
    const name = nameEl.value.trim();
    const price = parseFloat(priceEl.value.replace(',', '.'));
    if (!name || isNaN(price)) return; // ignora se faltar nome ou preço inválido
    SERVICES.push({ name, price });
    nameEl.value = ''; priceEl.value = '';
    renderAdminList();   // atualiza a lista dentro do painel
    renderServices();    // atualiza também o formulário público na hora
  }

  // Roda quando a profissional clica em "remover" em algum serviço da lista
  function adminRemoveService(i){
    SERVICES.splice(i, 1);
    renderAdminList();
    renderServices();
  }

  // Gera o texto de código (SERVICES atualizado) e copia pra área de transferência,
  // pra profissional colar no arquivo do site e tornar a mudança permanente.
  function copyServicesCode(){
    const code = 'let SERVICES = ' + JSON.stringify(SERVICES, null, 2) + ';';
    const out = document.getElementById('code-output');
    out.value = code;
    out.style.display = 'block';
    out.select();
    document.execCommand('copy');
  }

  function openAdminModal(){
    renderAdminList();
    document.getElementById('admin-modal').classList.add('open');
  }
  function closeAdminModal(){
    document.getElementById('admin-modal').classList.remove('open');
  }

  // Só mostra o link de acesso ao painel se a URL tiver "?admin=1" no final
  // (ex: seusite.com/index.html?admin=1) — assim clientes comuns não veem.
  if (new URLSearchParams(window.location.search).get('admin') === '1'){
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'admin-link';
    link.textContent = 'Área da profissional (gerenciar serviços)';
    link.onclick = (e) => { e.preventDefault(); openAdminModal(); };
    document.querySelector('footer').appendChild(link);
  }

  // Fecha qualquer modal aberto se a pessoa clicar fora da caixinha (no fundo escuro)
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });
  });

  // Desenha a lista de serviços assim que a página carrega
  renderServices();

  /* ---------- Decoração do topo (bolinhas coloridas animadas) ---------- */
  // Gera os "swatches" (bolinhas de esmalte) no hero, em tons de vinho/branco
  const colors = ['#5C1024','#8B1E3F','#F7ECE9','#D9C3C2','#3a0a16','#a53a56'];
  const container = document.getElementById('swatches');
  const positions = [
    {x:'10%', y:'10%', s:70, d:0},
    {x:'45%', y:'0%',  s:100, d:.1},
    {x:'75%', y:'20%', s:55, d:.2},
    {x:'20%', y:'50%', s:90, d:.3},
    {x:'60%', y:'55%', s:65, d:.4},
    {x:'85%', y:'65%', s:110, d:.5},
    {x:'35%', y:'80%', s:50, d:.6}
  ];
  positions.forEach((p,i)=>{
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.left = p.x;
    dot.style.top = p.y;
    dot.style.width = p.s+'px';
    dot.style.height = p.s+'px';
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = p.d+'s';
    dot.style.border = colors[i%colors.length] === '#F7ECE9' ? '1px solid #D9C3C2' : 'none';
    container.appendChild(dot);
  });