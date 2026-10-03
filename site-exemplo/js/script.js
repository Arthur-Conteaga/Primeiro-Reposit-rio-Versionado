document.getElementById('year').textContent = new Date().getFullYear();

/* =======================================================================
   CONFIGURAÇÃO DO SITE — edite só aqui para mudar número e serviços
   ======================================================================= */

/* Número do WhatsApp que recebe os pedidos: país + DDD + número, só dígitos, sem "+". */
const WHATSAPP_NUMBER = '5585987412966';

/* Lista de serviços: nome + preço.
   Alimenta automaticamente o formulário de agendamento e a seção "Sobre".
   Para adicionar, remover ou editar um serviço, edite esta lista. */
const SERVICES = [
  { name: 'Manicure simples', price: 20 },
  { name: 'Manicure em gel', price: 40 },
  { name: 'Pedicure spa dos pés', price: 45 },
  { name: 'Alongamento em gel', price: 90 },
  { name: 'Nail art personalizada', price: 10 },
  { name: 'Manutenção', price: 35 }
];

// Transforma um número em preço em reais. Exemplo: brl(20) vira "R$ 20,00"
const brl = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

/* ---------- Desenha a lista de serviços no formulário e na seção "Sobre" ---------- */
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

// Retorna os serviços marcados no formulário
function getSelectedServices(){
  const boxes = document.querySelectorAll('#services-list input[type=checkbox]:checked');
  return Array.from(boxes).map(b => SERVICES[b.dataset.idx]);
}

// Soma o preço dos serviços marcados e atualiza o "Total estimado"
function updateTotal(){
  const total = getSelectedServices().reduce((sum, s) => sum + s.price, 0);
  document.getElementById('total-price').textContent = brl(total);
}

/* ---------- Abrir/fechar o formulário de agendamento (modal) ---------- */
function openBookingModal(){
  // Não deixa escolher datas que já passaram
  const hoje = new Date();
  const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
  document.getElementById('c-data').min = iso;

  document.getElementById('booking-modal').classList.add('open');
  document.getElementById('c-nome').focus();
}
function closeBookingModal(){
  document.getElementById('booking-modal').classList.remove('open');
}

// Mostra uma mensagem abaixo do botão (tipo: 'ok' ou 'err')
function showMsg(text, type){
  const el = document.getElementById('form-msg');
  el.textContent = text;
  el.className = 'form-msg show ' + type;
}

/* =======================================================================
   ENVIAR PEDIDO: valida os campos, monta a mensagem e abre o WhatsApp
   com o texto já pronto. A cliente só precisa tocar em "enviar".
   ======================================================================= */
function submitBooking(){
  const nome = document.getElementById('c-nome').value.trim();
  const tel  = document.getElementById('c-tel').value.trim();
  const data = document.getElementById('c-data').value;
  const hora = document.getElementById('c-hora').value;
  const obs  = document.getElementById('c-obs').value.trim();
  const selecionados = getSelectedServices();

  if (!nome || !tel){ showMsg('Preencha nome e WhatsApp.', 'err'); return; }
  if (selecionados.length === 0){ showMsg('Escolha pelo menos um serviço.', 'err'); return; }

  const total = selecionados.reduce((sum, s) => sum + s.price, 0);
  const dataBR = data ? data.split('-').reverse().join('/') : 'não informada';

  const msg =
`Olá! Gostaria de agendar um horário.

*Nome:* ${nome}
*WhatsApp:* ${tel}
*Data preferida:* ${dataBR}
*Horário preferido:* ${hora || 'não informado'}

*Serviços:*
${selecionados.map(s => '• ' + s.name + ' - ' + brl(s.price)).join('\n')}

*Total estimado:* ${brl(total)}` + (obs ? `\n\n*Observações:* ${obs}` : '');

  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
  showMsg('Abrindo o WhatsApp para você enviar o pedido...', 'ok');
}

/* ---------- Fechar o modal clicando fora da caixa ou apertando Esc ---------- */
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBookingModal();
});

// Desenha a lista de serviços assim que a página carrega
renderServices();

/* ---------- Decoração do topo (bolinhas de esmalte animadas) ---------- */
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
positions.forEach((p, i) => {
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.style.left = p.x;
  dot.style.top = p.y;
  dot.style.width = p.s + 'px';
  dot.style.height = p.s + 'px';
  dot.style.background = colors[i % colors.length];
  dot.style.animationDelay = p.d + 's';
  dot.style.border = colors[i % colors.length] === '#F7ECE9' ? '1px solid #D9C3C2' : 'none';
  container.appendChild(dot);
});