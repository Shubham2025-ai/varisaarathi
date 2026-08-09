export async function fetchCurrentWeather(lat: number, lon: number) {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) throw new Error("OPENWEATHERMAP_API_KEY is not set");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`OpenWeatherMap request failed: ${res.status}`);

  const data = await res.json();
  return {
    tempC: data.main.temp as number,
    humidity: data.main.humidity as number,
  };
}