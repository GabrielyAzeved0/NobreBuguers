const cart = [];
const cartItemsElement = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const obsElement = document.getElementById('cart-obs');

document.getElementById("cart-toggle").addEventListener("click", () => {
  document.getElementById("cart-drawer").classList.add("open");
});

document.getElementById("close-cart").addEventListener("click", () => {
  document.getElementById("cart-drawer").classList.remove("open");
});

document.getElementById('pedidoForm').addEventListener('submit', (e) => e.preventDefault());

function addSelectedToCart() { 
  const checkboxes = document.querySelectorAll('input[name="item"]:checked');

  checkboxes.forEach(cb => {
    const name = cb.value;
    const price = parseFloat(cb.dataset.price);
    const quantidadeInput = document.querySelector(`.quantidade[data-for="${name}"]`);
    const quantidade = parseInt(quantidadeInput.value);

    if (quantidade > 0) {
      const existingItem = cart.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantidade += quantidade;
      } else {
        cart.push({ name, price, quantidade });
      }
    }

    cb.checked = false;
    quantidadeInput.value = 1;
  });

  if (cart.length > 0) {
    updateCartUI();
    const cartDrawer = document.getElementById('cart-drawer');
    requestAnimationFrame(() => {
      cartDrawer.classList.add('open');
    });
  }
}

function updateCartUI() {
  cartItemsElement.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantidade;
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.quantidade}x ${item.name} - R$${subtotal.toFixed(2)}
      <span class="remove-btn material-icons" onclick="removeFromCart(${index})">delete</span>
    `;
    cartItemsElement.appendChild(li);
    total += subtotal;
  });

  cartTotalElement.textContent = total.toFixed(2);

  const obs = document.getElementById('descricao').value.trim();
  if (obs) {
    obsElement.style.display = 'block';
    obsElement.innerHTML = `
      📝 <strong>Observações:</strong> ${obs}
      <span class="remove-btn material-icons" onclick="removeObservation()">delete</span>
    `;
  } else {
    obsElement.style.display = 'none';
    obsElement.innerHTML = '';
  }

  localStorage.setItem("carrinho", JSON.stringify(cart));
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function removeObservation() {
  document.getElementById('descricao').value = '';
  updateCartUI();
}

async function finalizeOrder() {
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  const referencia = document.getElementById('referencia').value.trim();
  const observacao = document.getElementById('descricao').value.trim();

  if (cart.length === 0) { alert("Carrinho vazio!"); return; }
  if (!nome || nome.split(' ').length < 2) { alert("Por favor, digite nome e sobrenome"); return; }
  const telefoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
  if (!telefoneRegex.test(telefone)) { alert("Telefone inválido!"); return; }
  if (!bairro || !referencia) { alert("Preencha todos os campos de endereço corretamente."); return; }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantidade), 0);
  const hoje = new Date().toISOString().split('T')[0]; 
  let pedidosData = JSON.parse(localStorage.getItem('pedidosData') || '{}');
  if (pedidosData.data !== hoje) pedidosData = { data: hoje, numero: 0 };
  pedidosData.numero += 1;
  localStorage.setItem('pedidosData', JSON.stringify(pedidosData));
  const numeroPedido = pedidosData.numero; 

  const agora = new Date();
  const dataHora = agora.toLocaleString(); 

  const msg = `
*Pedido Nobre Burgues* 

*Cliente:* ${nome}
*Telefone:* ${telefone}
*Bairro:* ${bairro}
*Referência:* ${referencia}
*Data/Hora do pedido:* ${dataHora}

*Itens:*
${cart.map(i => `${i.quantidade}x ${i.name} - R$${(i.price * i.quantidade).toFixed(2)}`).join('\n')}

*Observações:* ${observacao || 'Nenhuma'}
*Total:* R$${total.toFixed(2)}

*PEDIDOS SÓ SERÁ CONFIRMADO E ENTREGUE APÓS COMPROVANTE.*
`;
  const encodedMsg = encodeURIComponent(msg);
  const numero = '5585992307109';
  window.open(`https://wa.me/${numero}?text=${encodedMsg}`, '_blank');

  const sheetUrl = 'https://script.google.com/macros/s/AKfycbzYwEIfc5BaT3BSBtZ4Xccmq1Y3Xomxlb6ZisLLo_0HWeyx_Q7Ur4rGEdO3RGmFPeU7/exec';
  await fetch(sheetUrl, {
    method: 'POST',
    body: JSON.stringify({
      numeroPedido,
      nome,
      telefone,
      bairro,
      referencia,
      itens: cart.map(i => ({nome: i.name, quantidade: i.quantidade, preco: i.price})),
      total: total.toFixed(2),
      observacao,
      dataHora
    }),
    headers: { 'Content-Type': 'application/json' }
  }).then(res => console.log("Pedido enviado para planilha com sucesso!", res))
    .catch(err => console.error("Erro ao enviar pedido para planilha:", err));

  cart.length = 0;
  localStorage.removeItem("carrinho");
  document.getElementById('descricao').value = '';
  updateCartUI();
}

function salvarDadosPessoais() {
  const dados = {
    nome: document.getElementById('nome').value.trim(), 
    telefone: document.getElementById('telefone').value.trim(),
    bairro: document.getElementById('bairro').value.trim(),
    referencia: document.getElementById('referencia').value.trim(),
  };
  localStorage.setItem("dadosCliente", JSON.stringify(dados));
}

window.addEventListener('DOMContentLoaded', () => {
  const savedCart = localStorage.getItem("carrinho");
  if (savedCart) { cart.push(...JSON.parse(savedCart)); updateCartUI(); }

  const savedDados = localStorage.getItem("dadosCliente");
  if (savedDados) {
    const dados = JSON.parse(savedDados);
    document.getElementById('nome').value = dados.nome || '';
    document.getElementById('telefone').value = dados.telefone || '';
    document.getElementById('bairro').value = dados.bairro || '';
    document.getElementById('referencia').value = dados.referencia || '';
  }

  ["nome","telefone","bairro","referencia"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", salvarDadosPessoais);
  });
});
