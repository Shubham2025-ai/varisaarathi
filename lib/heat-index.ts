// Corrected Rothfusz heat index regression — standard NOAA formula, inputs
// in Fahrenheit, relative humidity as a percentage (0-100).
export function calculateHeatIndexF(tempF: number, humidity: number): number {
  const T = tempF;
  const RH = humidity;

  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * RH -
    0.22475541 * T * RH -
    0.00683783 * T * T -
    0.05481717 * RH * RH +
    0.00122874 * T * T * RH +
    0.00085282 * T * RH * RH -
    0.00000199 * T * T * RH * RH;

  // Low-humidity/low-temp adjustment, per NOAA's correction rules
  if (RH < 13 && T >= 80 && T <= 112) {
    const adjustment = ((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    HI -= adjustment;
  }
  if (RH > 85 && T >= 80 && T <= 87) {
    const adjustment = ((RH - 85) / 10) * ((87 - T) / 5);
    HI += adjustment;
  }

  return HI;
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function heatIndexLevel(heatIndexC: number): "LOW" | "MODERATE" | "HIGH" | "EXTREME" {
  if (heatIndexC < 32) return "LOW";
  if (heatIndexC < 41) return "MODERATE";
  if (heatIndexC < 54) return "HIGH";
  return "EXTREME";
}