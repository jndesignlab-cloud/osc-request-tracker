const API_URL = "https://script.google.com/macros/s/AKfycbwYs_RElgmZMEkWy937G0kooextR3M3P4MOUHhnoN2Zn6sLmyi3OhgPJbTJ__NDhc7Nzg/exec";

const trackingInput = document.getElementById('tracking-input');
const trackBtn = document.getElementById('track-btn');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const notfoundState = document.getElementById('notfound-state');
const resultCard = document.getElementById('result-card');

const STATUS_CLASS_MAP = {
  'open': 'status-open',
  'ongoing': 'status-ongoing',
  'reviewing': 'status-reviewing',
  'hold': 'status-hold',
  'completed': 'status-completed',
  'declined/rejected': 'status-rejected',
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
  const s = (status || '').toLowerCase().trim();

  if (s.includes('declined') || s.includes('rejected')) return 'status-rejected';
  if (s.includes('review')) return 'status-reviewing';
  if (s.includes('ongoing')) return 'status-ongoing';
  if (s.includes('hold')) return 'status-hold';
  if (s.includes('complete')) return 'status-completed';
  if (s.includes('open')) return 'status-open';

  return 'status-open';
}

function updateTimeline(status) {
  const s = (status || '').toLowerCase().trim();

  let currentIndex = -1;

  if (s.includes('open')) currentIndex = 0;
  if (s.includes('ongoing')) currentIndex = 1;
  if (s.includes('review')) currentIndex = 2;
  if (s.includes('complete')) currentIndex = 3;

  document.querySelectorAll('.timeline-step').forEach((step, index) => {
    step.classList.remove('active', 'current', 'blocked');

    if (s.includes('hold') || s.includes('declined') || s.includes('rejected')) {
      step.classList.add('blocked');
      return;
    }

    if (index <= currentIndex) step.classList.add('active');
    if (index === currentIndex) step.classList.add('current');
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '—';
}

function formatQueue(position, total) {
  if (!position || !total) return '—';

  if (position === 1) {
    return `1st in line (${total} open request${total === 1 ? '' : 's'})`;
  }

  if (position === 2) {
    return `2nd in line (${total} open requests)`;
  }

  if (position === 3) {
    return `3rd in line (${total} open requests)`;
  }

  return `${position}th in line (${total} open requests)`;
}

function showResult(data) {
  hideAll();

  setText('res-tracking', data.tracking);
  setText('res-name', data.name);
  setText('res-type', data.type);
  setText('res-title', data.title);
  setText('res-assigned', data.assigned);
  setText('res-date-submitted', data.date_submitted);
  setText('res-date-needed', data.date_needed);

  const queueText = formatQueue(data.queue_position, data.total_open);
  setText('res-queue', queueText);

  const badge = document.getElementById('res-status-badge');
  if (badge) {
    badge.textContent = data.status || 'Unknown';
    badge.className = 'status-badge ' + getStatusClass(data.status);
  }

  updateTimeline(data.status);

  resultCard.classList.remove('hidden');
}

async function trackApplication() {
  const trackingNumber = trackingInput.value.trim();

  if (!trackingNumber) {
    trackingInput.focus();
    trackingInput.style.borderColor = '#dc2626';
    setTimeout(() => {
      trackingInput.style.borderColor = '';
    }, 1200);
    return;
  }

  trackBtn.disabled = true;
  showLoading();

  try {
    const response = await fetch(`${API_URL}?tracking=${encodeURIComponent(trackingNumber)}`);

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
