

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
        input.dispatchEvent(new Event('input', { bubbles: true }));
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











// ────────────────────────────────────────────────
// Personal Info – Real-time validation + country code + session save
// ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('personalInfoForm');
  const button = document.getElementById('nextPersonalInfo');

  if (!form || !button) return;

  const fields = {
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    countryCode: document.getElementById('countryCode'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email')
  };

  // ── Sanitize function ──────────────────────────
  function sanitize(str) {
    if (!str) return '';
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]))
      .trim();
  }

  // ── Phone + country code validation ────────────
  function isPhoneValid() {
    return (
      fields.countryCode.value !== '' &&
      fields.phone.validity.valid
    );
  }

  // ── Full form validation ───────────────────────
  function isFormValid() {
    return (
      fields.firstName.validity.valid &&
      fields.lastName.validity.valid &&
      fields.email.validity.valid &&
      isPhoneValid()
    );
  }

  // ── Update button state ────────────────────────
  function updateButtonState() {
    const valid = isFormValid();
    button.disabled = !valid;
    button.style.opacity = valid ? '1' : '0.55';
    button.style.cursor = valid ? 'pointer' : 'not-allowed';
  }

  // ── Toggle error messages ──────────────────────
  function toggleFieldError(field, show) {
    const error = field.closest('.position-relative')?.querySelector('.invalid-feedback')
      || field.nextElementSibling;

    if (!error) return;

    error.style.display = show ? 'block' : 'none';
    field.classList.toggle('is-invalid', show);
    field.classList.toggle('is-valid', !show);
  }

  // ── Real-time validation ───────────────────────
  Object.values(fields).forEach(field => {
    field.addEventListener('input', () => {
      if (field === fields.phone || field === fields.countryCode) {
        toggleFieldError(fields.phone, !isPhoneValid());
      } else {
        toggleFieldError(field, !field.validity.valid);
      }
      updateButtonState();
    });

    field.addEventListener('blur', () => {
      if (field === fields.phone || field === fields.countryCode) {
        toggleFieldError(fields.phone, !isPhoneValid());
      } else {
        toggleFieldError(field, !field.validity.valid);
      }
      updateButtonState();
    });
  });

  updateButtonState();

  // ── Submit handler ─────────────────────────────
  form.addEventListener('submit', e => {
    e.preventDefault();

    if (!isFormValid()) {
      Object.values(fields).forEach(field => {
        if (field === fields.phone || field === fields.countryCode) {
          toggleFieldError(fields.phone, !isPhoneValid());
        } else {
          toggleFieldError(field, !field.validity.valid);
        }
      });
      return;
    }

    // ── Combine phone number ──────────────────────
    const fullPhone = `${fields.countryCode.value}${fields.phone.value}`;

    // ── Save final sanitized data ─────────────────
    const personalInfo = {
      firstName: sanitize(fields.firstName.value),
      lastName: sanitize(fields.lastName.value),
      phone: sanitize(fullPhone), // ← FINAL phone saved
      email: sanitize(fields.email.value),
      // location: document.getElementById('locationInput')?.value.trim() || null,
      savedAt: new Date().toISOString()
    };

    sessionStorage.setItem('personalInfo', JSON.stringify(personalInfo));
    console.log('Personal information saved:', personalInfo);

    // ── Move to next step ─────────────────────────
    document.getElementById('step1-3').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
  });
});






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





// ── Pick-Up Details Form: Validation, Autocomplete, Session Save ───────────────────────────────

const liftInput = document.getElementById('liftAvailability');
const floorInput = document.getElementById('floor');
const durationInput = document.getElementById('durationMonths');
const durationValue = document.getElementById('durationValue');
const dateInput = document.getElementById('tentativeDate');
const continueBtn = document.getElementById('continuePickupBtn');

// Errors
const liftError = document.getElementById('lift-error');
const floorError = document.getElementById('floor-error');
const durationError = document.getElementById('duration-error');
const dateError = document.getElementById('date-error');


// 1. Initialize Flatpickr for Tentative Date (Yellow Theme)
flatpickr("#tentativeDate", {
  dateFormat: "Y-m-d",
  minDate: "today",
  defaultDate: new Date(), // default to 1 week ahead
});

// 2. Update Duration Value Display
durationInput.addEventListener('input', (e) => {
  const months = e.target.value;
  durationValue.textContent = months + (months == 1 ? ' month' : ' months');
  validateForm();
});

// 3. Load Preferred Area from Session (if any)
document.addEventListener("DOMContentLoaded", () => {
  const saved = sessionStorage.getItem("searchLocation");
  if (saved && saved.trim()) {
    preferredInput.value = saved.trim();
  }
  validateForm(); // initial check
});

// 4. Form Validation Function
function validateForm() {
  let valid = true;

  // Preferred Area
  const prefVal = preferredInput.value.trim();
  if (prefVal.length < 4) {
    preferredError.style.display = 'block';
    valid = false;
  } else {
    preferredError.style.display = 'none';
  }

  // Lift Availability
  if (!liftInput.value) {
    liftError.style.display = 'block';
    valid = false;
  } else {
    liftError.style.display = 'none';
  }

  // Floor
  const floorVal = floorInput.value.trim();
  if (!floorVal || isNaN(floorVal) || floorVal < 0) {
    floorError.style.display = 'block';
    valid = false;
  } else {
    floorError.style.display = 'none';
  }

  // Duration
  if (!durationInput.value || durationInput.value < 1) {
    durationError.style.display = 'block';
    valid = false;
  } else {
    durationError.style.display = 'none';
  }

  // Date
  if (!dateInput.value) {
    dateError.style.display = 'block';
    valid = false;
  } else {
    dateError.style.display = 'none';
  }

  // Enable/Disable Continue Button
  if (continueBtn) {
    continueBtn.disabled = !valid;
  }

  return valid;
}

// 5. Attach Validation to All Fields
['input', 'change'].forEach(eventType => {
  preferredInput.addEventListener(eventType, validateForm);
  liftInput.addEventListener(eventType, validateForm);
  floorInput.addEventListener(eventType, validateForm);
  durationInput.addEventListener(eventType, validateForm);
  dateInput.addEventListener(eventType, validateForm);
});

// 6. Continue Button: Validate → Save to SessionStorage → Alert
continueBtn.addEventListener('click', (e) => {
  if (!validateForm()) {
    e.preventDefault();
    alert('Please fill all required fields correctly.');
    return;
  }

  // Sanitize & Prepare Data
  const pickupData = {
    preferredArea: preferredInput.value.trim(),
    liftAvailability: liftInput.value.trim(),
    floor: Number(floorInput.value.trim()),
    durationMonths: Number(durationInput.value),
    tentativeDate: dateInput.value.trim()
  };

  // Save to sessionStorage
  sessionStorage.setItem('pickupDetails', JSON.stringify(pickupData));
  // console.log('Pickup details saved:', pickupData);

  alert('Pickup location saved successfully!');

});



