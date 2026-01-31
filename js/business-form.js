// Autocomplete logic (unchanged)

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
      const cityLower = item.city.toLowerCase();
      const stateLower = item.state.toLowerCase();
      const zipLower = item.zip.toLowerCase();

      if (hasComma && parts.length >= 2) {
        const cityPart = parts[0].toLowerCase();
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
      // li.className = 'no-match';
      // li.textContent = 'No exact match — you can still search with this value';
      // suggestions.appendChild(li);
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
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    suggestions.appendChild(li);
  });

  suggestions.style.display = 'block';
  selectedIndex = -1;
}





// ── Preferred Area – Click to Edit + Autocomplete + Auto-Save ───────────────────────────────

const preferredInput = document.getElementById('preferredAreaInput');
const preferredSuggestions = document.getElementById('preferredSuggestions');
const preferredError = document.getElementById('preferred-error');

let preferredSelectedIndex = -1;

// 1. Load saved value on page load
document.addEventListener("DOMContentLoaded", () => {
  if (!preferredInput) return;

  const saved = sessionStorage.getItem("searchLocation");
  if (saved && saved.trim()) {
    preferredInput.value = saved.trim();
    console.log("Preferred Area loaded from session:", saved);
  } else {
    console.log("No saved preferred area found");
  }
});

// 2. Click anywhere on the input → enable editing
preferredInput.addEventListener('click', () => {
  if (preferredInput.disabled) {
    preferredInput.disabled = false;
    preferredInput.focus();
    console.log("Preferred Area input now editable");
  }
});

// 3. When user finishes editing (blur) → save to sessionStorage
preferredInput.addEventListener('blur', () => {
  const value = preferredInput.value.trim();
  if (value) {
    sessionStorage.setItem("searchLocation", value);
    console.log("Preferred Area saved on blur:", value);
  }
  // Optional: disable again after blur (remove if you want to keep it enabled)
  // preferredInput.disabled = true;
});

// 4. Autocomplete on input (same as main form)
preferredInput.addEventListener('input', async () => {
  await ensureDataLoaded(); // reuse from main script

  const query = preferredInput.value.trim();
  const matches = getSuggestions(query);
  renderPreferredSuggestions(matches, query);
});

// 5. Render suggestions
function renderPreferredSuggestions(matches, query) {
  preferredSuggestions.innerHTML = '';

  if (matches.length === 0) {
    preferredSuggestions.style.display = query.trim() ? 'block' : 'none';
    preferredSelectedIndex = -1;
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
      preferredInput.value = `${item.city}, ${item.state} ${item.zip}`;
      preferredSuggestions.style.display = 'none';
      preferredSelectedIndex = -1;

      // Save immediately on selection
      sessionStorage.setItem("searchLocation", preferredInput.value.trim());
      console.log("Preferred Area saved via suggestion click:", preferredInput.value);

      preferredInput.dispatchEvent(new Event('input', { bubbles: true }));
      preferredInput.blur(); // optional: finish editing after selection
    });

    preferredSuggestions.appendChild(li);
  });

  preferredSuggestions.style.display = 'block';
  preferredSelectedIndex = -1;
}

// 6. Keyboard navigation + Enter → save
preferredInput.addEventListener('keydown', async (e) => {
  await ensureDataLoaded();

  const items = preferredSuggestions.querySelectorAll('li');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (preferredSelectedIndex < items.length - 1) {
      preferredSelectedIndex++;
      highlightPreferredItem(items);
    }
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (preferredSelectedIndex > -1) {
      preferredSelectedIndex--;
      highlightPreferredItem(items);
    }
  }
  else if (e.key === 'Enter') {
    if (preferredSelectedIndex >= 0 && items[preferredSelectedIndex]) {
      e.preventDefault();
      const selectedLi = items[preferredSelectedIndex];
      const city = selectedLi.querySelector('span')?.textContent?.trim();
      const item = allLocations.find(loc => loc.city === city);

      if (item) {
        preferredInput.value = `${item.city}, ${item.state} ${item.zip}`;

        // Save on Enter
        sessionStorage.setItem("searchLocation", preferredInput.value.trim());
        console.log("Preferred Area saved via Enter:", preferredInput.value);
      }

      preferredSuggestions.style.display = 'none';
      preferredSelectedIndex = -1;
      preferredInput.blur(); // optional: finish editing
    }
  }
  else if (e.key === 'Escape') {
    preferredSuggestions.style.display = 'none';
    preferredSelectedIndex = -1;
  }
});

function highlightPreferredItem(items) {
  items.forEach((li, i) => {
    li.classList.toggle('selected', i === preferredSelectedIndex);
  });
  if (preferredSelectedIndex >= 0) {
    items[preferredSelectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// 7. Hide suggestions when clicking outside
document.addEventListener('click', e => {
  if (!preferredInput.contains(e.target) && !preferredSuggestions.contains(e.target)) {
    preferredSuggestions.style.display = 'none';
  }
});

