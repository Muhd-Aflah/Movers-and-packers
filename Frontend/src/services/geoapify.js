const GEO_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

// Convert address → lat/lon
export async function geocodeAddress(address) {
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      address
    )}&limit=1&apiKey=${GEO_KEY}`
  );

  const data = await res.json();

  if (!data.features.length) {
    throw new Error("Location not found");
  }

  const [lon, lat] = data.features[0].geometry.coordinates;
  return { lat, lon };
}

// Calculate distance in KM
export async function getDistanceKm(origin, destination) {
  const originCoords = await geocodeAddress(origin);
  const destCoords = await geocodeAddress(destination);

  const res = await fetch(
    `https://api.geoapify.com/v1/routing?waypoints=${originCoords.lat},${originCoords.lon}|${destCoords.lat},${destCoords.lon}&mode=drive&apiKey=${GEO_KEY}`
  );

  const data = await res.json();

  const meters = data.features[0].properties.distance;
  return meters / 1000; // km
}
