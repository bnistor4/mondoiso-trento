/** WGS84/ETRS89 -> UTM (Krüger series, mm-level within a zone). Used for PAT (Trento) rasters in UTM 32N. */
export function llToUtm(lat: number, lon: number, zone = 32): [number, number] {
  const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996;
  const n = f / (2 - f), A = (a / (1 + n)) * (1 + n * n / 4 + n ** 4 / 64);
  const al = [n / 2 - (2 / 3) * n * n + (5 / 16) * n ** 3, (13 / 48) * n * n - (3 / 5) * n ** 3, (61 / 240) * n ** 3];
  const φ = (lat * Math.PI) / 180, λ = ((lon - (zone * 6 - 183)) * Math.PI) / 180;
  const e = 2 * Math.sqrt(n) / (1 + n);
  const t = Math.sinh(Math.atanh(Math.sin(φ)) - e * Math.atanh(e * Math.sin(φ)));
  const ξ = Math.atan2(t, Math.cos(λ)), η = Math.atanh(Math.sin(λ) / Math.sqrt(1 + t * t));
  let E = η, N = ξ;
  for (let j = 1; j <= 3; j++) { E += al[j - 1] * Math.cos(2 * j * ξ) * Math.sinh(2 * j * η); N += al[j - 1] * Math.sin(2 * j * ξ) * Math.cosh(2 * j * η); }
  return [500000 + k0 * A * E, k0 * A * N];
}
