const JSON_URL = '../utilities/USCities.json'; // or full URL if hosted: 'https://raw.githubusercontent.com/millbj92/US-Zip-Codes-JSON/master/USCities.json'

let allLocations = [];
let selectedIndex = -1;

const input = document.getElementById('locationInput');
const suggestions = document.getElementById('suggestions');

// 1. Load the JSON once
fetch(JSON_URL)
  .then(response => {
    if (!response.ok) throw new Error('Failed to load USCities.json');
    return response.json();
  })
  .then(data => {
    allLocations = data.map(item => ({
      zip: String(item.zip_code).padStart(5, '0'), // ensure 5 digits
      city: item.city.trim(),
      state: item.state.trim()
    }));

    console.log(`Loaded ${allLocations.length} US ZIP entries`);
  })
  .catch(err => {
    console.error('Error loading ZIP data:', err);
    // Optional: fallback message in UI
  });

// 2. Filter function
function getSuggestions(query) {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();

  // Split if looks like "city, state" or "state zip"
  const parts = q.split(/[\s,]+/).filter(Boolean);
  const hasComma = query.includes(',');

  return allLocations
    .filter(item => {
      const cityLower  = item.city.toLowerCase();
      const stateLower = item.state.toLowerCase();
      const zipLower   = item.zip.toLowerCase();

      if (hasComma && parts.length >= 2) {
        // e.g. "New York, NY" or "Dallas, Texas"
        const cityPart  = parts[0].toLowerCase();
        const statePart = parts.slice(1).join(' ').toLowerCase();
        return (
          cityLower.includes(cityPart) &&
          (stateLower.includes(statePart) || statePart.length <= 2)
        );
      }

      // Normal search: match any part
      return (
        zipLower.includes(q) ||
        cityLower.includes(q) ||
        stateLower.includes(q)
      );
    })
    .slice(0, 25); // limit suggestions to avoid huge list
}

// 3. Render suggestions
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
      // Optional: auto-submit form here if desired
      // input.form.submit();
    });
    suggestions.appendChild(li);
  });

  suggestions.style.display = 'block';
  selectedIndex = -1;
}

// 4. Input handler
input.addEventListener('input', () => {
  const query = input.value.trim();
  const matches = getSuggestions(query);
  renderSuggestions(matches, query);
});

// 5. Keyboard navigation
input.addEventListener('keydown', e => {
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
      const item = allLocations.find(loc =>
        loc.city === items[selectedIndex].querySelector('span').textContent.split(',')[0].trim()
      );
      if (item) {
        input.value = `${item.city}, ${item.state} ${item.zip}`;
      }
      suggestions.style.display = 'none';
      selectedIndex = -1;
    }
    // If no selection → just let form submit with typed value
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

// 6. Hide on outside click
document.addEventListener('click', e => {
  if (!input.contains(e.target) && !suggestions.contains(e.target)) {
    suggestions.style.display = 'none';
  }
});