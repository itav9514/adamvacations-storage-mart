// Your main JS file – save as e.g. autocomplete.js
// IMPORTANT: This file must be loaded with <script type="module" src="..."></script>

import { loadUSData } from './us-cities-data.js';  // adjust path if needed, e.g. './js/data.js'

// No more local fetch or allLocations declaration here!

let selectedIndex = -1;

const input = document.getElementById('locationInput');
const suggestions = document.getElementById('suggestions');

// Load data once when the script runs (or on first input if you prefer lazy)
let locationsLoaded = false;
let allLocations = []; // local reference – will be filled once

async function ensureDataLoaded() {
  if (!locationsLoaded) {
    allLocations = await loadUSData();
    locationsLoaded = true;
  }
}

// 2. Filter function (now uses allLocations after await)
function getSuggestions(query) {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();
  const parts = q.split(/[\s,]+/).filter(Boolean);
  const hasComma = query.includes(',');

  return allLocations
    .filter(item => {
      const cityLower  = item.city.toLowerCase();
      const stateLower = item.state.toLowerCase();
      const zipLower   = item.zip.toLowerCase();

      if (hasComma && parts.length >= 2) {
        const cityPart  = parts[0].toLowerCase();
        const statePart = parts.slice(1).join(' ').toLowerCase();
        return (
          cityLower.includes(cityPart) &&
          (stateLower.includes(statePart) || statePart.length <= 2)
        );
      }

      return (
        zipLower.includes(q) ||
        cityLower.includes(q) ||
        stateLower.includes(q)
      );
    })
    .slice(0, 25);
}

// 3. Render suggestions (unchanged, but now allLocations is filled)
function renderSuggestions(matches, query) {
  suggestions.innerHTML = '';

  if (matches.length === 0) {
    if (query.trim()) {
      const li = document.createElement('li');
      li.className = 'no-match';
      li.textContent = 'No exact match — you can still search with this value';
      suggestions.appendChild(li);
    }
    suggestions.style.display = query.trim() ? 'block' : 'none';
    selectedIndex = -1;
    return;
  }

  matches.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.city}</span>,
      <span class="state">${item.state}</span>
      <span class="zip">(${item.zip})</span>
    `;
    li.dataset.index = index;
    li.addEventListener('click', () => {
      input.value = `${item.city}, ${item.state} ${item.zip}`;
      suggestions.style.display = 'none';
      selectedIndex = -1;
    });
    suggestions.appendChild(li);
  });

  suggestions.style.display = 'block';
  selectedIndex = -1;
}

// 4. Input handler – now async to wait for data
input.addEventListener('input', async () => {
  await ensureDataLoaded(); // ensure data is ready before filtering

  const query = input.value.trim();
  const matches = getSuggestions(query);
  renderSuggestions(matches, query);
});

// 5. Keyboard navigation (updated to use allLocations)
input.addEventListener('keydown', async (e) => {
  await ensureDataLoaded(); // safe-guard

  const items = suggestions.querySelectorAll('li:not(.no-match)');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (selectedIndex < items.length - 1) {
      selectedIndex++;
      highlightItem(items);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (selectedIndex > -1) {
      selectedIndex--;
      highlightItem(items);
    }
  } else if (e.key === 'Enter') {
    if (selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      const selectedText = items[selectedIndex].querySelector('span').textContent.trim();
      const city = selectedText.split(',')[0].trim();
      const item = allLocations.find(loc => loc.city === city);
      if (item) {
        input.value = `${item.city}, ${item.state} ${item.zip}`;
      }
      suggestions.style.display = 'none';
      selectedIndex = -1;
    }
  } else if (e.key === 'Escape') {
    suggestions.style.display = 'none';
    selectedIndex = -1;
  }
});

function highlightItem(items) {
  items.forEach((li, i) => {
    li.classList.toggle('selected', i === selectedIndex);
  });
  if (selectedIndex >= 0) {
    items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// 6. Hide on outside click (unchanged)
document.addEventListener('click', e => {
  if (!input.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.style.display = 'none';
  }
});

// 7. Form submit (unchanged)
const searchForm = document.getElementById('locationSearchForm');

searchForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const locationValue = input.value.trim();

  if (locationValue) {
    sessionStorage.setItem('searchLocation', locationValue);
    console.log('Saved location:', locationValue);
  } else {
    sessionStorage.removeItem('searchLocation');
  }

  window.location.href = 'Form.html'; // your next page
});