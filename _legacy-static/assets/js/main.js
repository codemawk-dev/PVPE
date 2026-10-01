// Modal "Solicitar camisa": escolhe modelo + tamanho e abre o WhatsApp com o pedido.
(function () {
  var modal = document.getElementById('shirt-modal');
  var form = document.getElementById('shirt-form');
  if (!modal || !form) return;

  var submit = form.querySelector('.modal-submit');

  document.querySelectorAll('[data-open-modal="shirt-modal"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      modal.showModal();
    });
  });

  modal.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      modal.close();
    });
  });

  // fecha ao clicar fora da caixa
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.close();
  });

  // só libera o botão quando modelo e tamanho estiverem escolhidos
  form.addEventListener('change', function () {
    submit.disabled = !(form.modelo.value && form.tamanho.value);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var modelo = form.modelo.value;
    var tamanho = form.tamanho.value;
    if (!modelo || !tamanho) return;

    var msg =
      'Olá! Quero solicitar a camisa do PVPE 🏐\n\n' +
      '• Modelo: ' + modelo + '\n' +
      '• Tamanho: ' + tamanho + '\n\n' +
      'Pode me passar o valor e como faço para receber?';

    window.open('https://wa.me/' + form.dataset.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    modal.close();
    form.reset();
    submit.disabled = true;
  });
})();
