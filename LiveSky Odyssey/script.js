const OPENWEATHER_API_KEY = "30e42fd27464024a1c78c545b41c1ace";
let map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

document.getElementById("travelForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const preferredTemp = parseFloat(document.getElementById("temperature").value);
  const range = parseFloat(document.getElementById("range").value);

  navigator.geolocation.getCurrentPosition(async (position) => {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    const cities = await fetch("cities.json").then(res => res.json());

    const nearbyCities = cities.filter(city => {
      const dist = getDistance(userLat, userLon, city.lat, city.lon);
      return dist <= range;
    });

    const matchingCities = await filterCitiesByTemp(nearbyCities, preferredTemp);
    displayResults(matchingCities.slice(0, 5));
  });
});

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function filterCitiesByTemp(cities, preferredTemp) {
  const matched = [];

  for (const city of cities) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const temp = data.main.temp - 273.15;

    if (Math.abs(temp - preferredTemp) <= 2) {
      matched.push({
        name: city.name,
        weather: data.weather[0].main,
        temp: temp.toFixed(1) + "°C",
        lat: city.lat,
        lon: city.lon
      });
    }
  }
  return matched;
}

function displayResults(cities) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });

  if (cities.length === 0) {
    resultsDiv.innerHTML = "<p>No matching locations found.</p>";
    return;
  }

  cities.forEach(city => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${city.name}</strong><br>Weather: ${city.weather}<br>Temperature: ${city.temp}<hr>`;
    resultsDiv.appendChild(div);

    L.marker([city.lat, city.lon])
      .addTo(map)
      .bindPopup(`<b>${city.name}</b><br>${city.temp}<br>${city.weather}`)
      .openPopup();

    map.setView([city.lat, city.lon], 6);
  });
}