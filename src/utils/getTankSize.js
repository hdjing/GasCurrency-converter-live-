import { carTankSizes } from "../data/carTankSizes";

export function getTankSize(make, model) {
  if (!make || !model) return null;
  const makeEntry = carTankSizes[make];
  if (!makeEntry) return null;
  return makeEntry[model] || null;
}
