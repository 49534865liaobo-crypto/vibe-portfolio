const statusEl = document.querySelector('#payment-status');
const buttons = [...document.querySelectorAll('.pay-button')];

const showStatus = (message, type = 'success') => {
  statusEl.textContent = message;
  statusEl.className = `payment-status visible ${type}`;
};

const query = new URLSearchParams(window.location.search);
if (query.get('checkout') === 'success') {
  showStatus('Payment received. Thank you — please send your script, brand assets and production brief through the contact link below.');
  statusEl.scrollIntoView({ block: 'center' });
} else if (query.get('checkout') === 'cancelled') {
  showStatus('Checkout was cancelled. No payment was taken.', 'error');
}

buttons.forEach((button) => {
  button.addEventListener('click', async () => {
    const originalLabel = button.textContent;
    buttons.forEach((item) => { item.disabled = true; });
    button.textContent = 'Opening checkout…';
    try {
      const response = await fetch('/api/create-avatar-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: button.dataset.plan }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.message || 'Unable to open secure checkout.');
      window.location.assign(data.url);
    } catch (error) {
      showStatus(error.message || 'Unable to open secure checkout. Please try again.', 'error');
      buttons.forEach((item) => { item.disabled = false; });
      button.textContent = originalLabel;
    }
  });
});
