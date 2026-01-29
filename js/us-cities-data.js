// data.js
let allLocations = [];

const JSON_URL = '../utilities/USCities.json';

export const loadUSData = async () => {
  if (allLocations.length > 0) return allLocations;

  try {
    const response = await fetch(JSON_URL);
    if (!response.ok) throw new Error('Failed to load');
    const data = await response.json();

    allLocations = data.map(item => ({
      zip: String(item.zip_code).padStart(5, '0'),
      city: item.city.trim(),
      state: item.state.trim()
    }));

    console.log(`Loaded ${allLocations.length} entries`);
    return allLocations;
  } catch (err) {
    console.error('Error loading US data:', err);
    return [];
  }
};

// Optional: export a getter
export const getUSLocations = () => allLocations;