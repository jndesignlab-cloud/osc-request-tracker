const API_URL = "https://script.google.com/macros/s/AKfycbwYs_RElgmZMEkWy937G0kooextR3M3P4MOUHhnoN2Zn6sLmyi3OhgPJbTJ__NDhc7Nzg/exec";

const trackingInput = document.getElementById('tracking-input');
const trackBtn = document.getElementById('track-btn');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const notfoundState = document.getElementById('notfound-state');
let resultCard = document.getElementById('result-card');

const STATUS_CLASS_MAP = {
  'submitted': 'status-submitted',
  'under review': 'status-under-review',
  'processing': 'status-processing',
  'approved': 'status-approved',
  'rejected': 'status-rejected',
  'completed': 'status-completed',
};

function hideAll() {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  notfoundState.classList.add('hidden');
  resultCard.classList.add('hidden');
}

function showLoading() {
  hideAll();
  loadingState.classList.remove('hidden');
}

function showError(msg) {
  hideAll();
  errorMessage.textContent = msg || 'Something went wrong. Please try again.';
  errorState.classList.remove('hidden');
}

function showNotFound(msg) {
  hideAll();
  notfoundState.textContent = msg || 'No record found. Please check your tracking number.';
  notfoundState.classList.remove('hidden');
}

function getStatusClass(status) {
  return STATUS_CLASS_MAP[(status || '').toLowerCase().trim()] || 'status-submitted';
}

function showResult(data) {
  hideAll();

  document.getElementById('res-tracking').textContent = data.tracking || '—';
  document.getElementById('res-name').textContent = data.name || '—';
  document.getElementById('res-type').textContent = data.type || '—';
  document.getElementById('res-title').textContent = data.title || '—';
  document.getElementById('res-assigned').textContent = data.assigned || '—';
  document.getElementById('res-date-submitted').textContent = data.date_submitted || '—';

  const badge = document.getElementById('res-status-badge');
  badge.textContent = data.status || 'Unknown';
  badge.className = 'status-badge ' + getStatusClass(data.status);

  const clone = resultCard.cloneNode(true);
  resultCard.parentNode.replaceChild(clone, resultCard);
  resultCard = clone;
  resultCard.classList.remove('hidden');
}

async function trackApplication() {
  const trackingNumber = trackingInput.value.trim();

  if (!trackingNumber) {
    trackingInput.focus();
    trackingInput.style.borderColor = '#dc2626';
    setTimeout(() => { trackingInput.style.borderColor = ''; }, 1200);
    return;
  }

  trackBtn.disabled = true;
  showLoading();

  try {
    const response = await fetch(`${API_URL}?tracking=${encodeURIComponent(trackingNumber)}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const json = await response.json();

    if (json && json.found === true && json.data) {
      showResult(json.data);
    } else {
      showNotFound(json.message);
    }
  } catch (err) {
    showError('Something went wrong. Please try again.');
    console.error('[Tracker] Fetch error:', err);
  } finally {
    trackBtn.disabled = false;
  }
}

trackBtn.addEventListener('click', trackApplication);

trackingInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') trackApplication();
});

trackingInput.addEventListener('input', () => {
  trackingInput.style.borderColor = '';
});
