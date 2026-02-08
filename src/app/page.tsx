"use client";
import { useState, useEffect } from "react";
import { InputBox } from "../components/exportFiles";
import { carTankSizes } from "@/data/carTankSizes";
import { getTankSize } from "@/utils/getTankSize";

// Types for strong TS safety
type Make = keyof typeof carTankSizes;
type Model<M extends Make> = keyof typeof carTankSizes[M];

export default function Home() {
  const [usdPerGallon, setUsdPerGallon] = useState(0);
  const [cadPerLitre, setCadPerLitre] = useState(0);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [mode, setMode] = useState<"usdToCad" | "cadToUsd">("usdToCad");

  // Car savings tool state
  const [selectedMake, setSelectedMake] = useState<Make | "">("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tankSize, setTankSize] = useState<number | null>(null);
  const [fillLevel, setFillLevel] = useState(0.5);
  const [savings, setSavings] = useState<number | null>(null);

  const LITRES_PER_GALLON = 3.78541;
  const CACHE_KEY = "usd_to_cad_rate";
  const CACHE_DURATION = 60 * 60 * 1000;

  // Load exchange rate with caching
  useEffect(() => {
    async function loadRate() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);

        if (cached) {
          const parsed = JSON.parse(cached);
          const isFresh = Date.now() - parsed.timestamp < CACHE_DURATION;

          if (isFresh) {
            setExchangeRate(parsed.rate);
            setLastUpdated(parsed.timestamp);
            return;
          }
        }

        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await res.json();
        const rate = data.rates.CAD;
        const timestamp = Date.now();

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ rate, timestamp })
        );

        setExchangeRate(rate);
        setLastUpdated(timestamp);
      } catch (err) {
        console.error("Error fetching exchange rate:", err);
      }
    }

    loadRate();
  }, []);

  // Auto-set tank size when make/model selected
  useEffect(() => {
    if (!selectedMake || !selectedModel) {
      setTankSize(null);
      return;
    }

    const tank = getTankSize(
      selectedMake as Make,
      selectedModel as Model<Make>
    );

    setTankSize(tank?.tankSizeL ?? null);
  }, [selectedMake, selectedModel]);

  // Convert gas price
  const convertGasPrice = () => {
    if (!exchangeRate) return;

    if (mode === "usdToCad") {
      const result = (usdPerGallon / LITRES_PER_GALLON) * exchangeRate;
      setCadPerLitre(result);
    } else {
      const result = (cadPerLitre * (1 / exchangeRate)) * LITRES_PER_GALLON;
      setUsdPerGallon(result);
    }
  };

  // Calculate savings
  const calculateSavings = () => {
    if (!exchangeRate || !tankSize) return;

    const litresAdded = tankSize * fillLevel;
    const cadPrice = cadPerLitre;
    const usdConvertedToCad = (usdPerGallon / LITRES_PER_GALLON) * exchangeRate;

    const costInCanada = litresAdded * cadPrice;
    const costInUS = litresAdded * usdConvertedToCad;

    setSavings(costInCanada - costInUS);
  };

  // Dropdown lists
  const makes = Object.keys(carTankSizes) as Make[];
  const models =
    selectedMake !== ""
      ? (Object.keys(
          carTankSizes[selectedMake as Make]
        ) as string[])
      : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-gray-50 to-white">

      {/* Header */}
      <header className="pt-12 text-center">
        <h1 className="text-4xl font-semibold text-gray-800 tracking-tight">
          Gas Price Converter
        </h1>
        <p className="text-gray-500 mt-2">
          Convert fuel prices and calculate cross-border savings
        </p>
      </header>

      {/* Main Section */}
      <main className="w-full flex flex-col items-center px-4 space-y-10">

        {/* Converter Card */}
        <div className="w-full max-w-md border border-gray-200 rounded-xl p-6 shadow-md bg-white space-y-4">

          {/* Toggle */}
          <div className="flex w-full bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode("usdToCad")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition 
                ${mode === "usdToCad" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
            >
              USD → CAD
            </button>

            <button
              onClick={() => setMode("cadToUsd")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition 
                ${mode === "cadToUsd" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
            >
              CAD → USD
            </button>
          </div>

          {/* Dynamic Live Rate */}
          {exchangeRate && (
            <p className="text-sm text-gray-600 text-center">
              {mode === "usdToCad" ? (
                <>Live rate: <span className="font-medium">1 USD = {exchangeRate.toFixed(3)} CAD</span></>
              ) : (
                <>Live rate: <span className="font-medium">1 CAD = {(1 / exchangeRate).toFixed(3)} USD</span></>
              )}
            </p>
          )}

          {/* Converter Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              convertGasPrice();
            }}
            className="space-y-4"
          >
            {mode === "usdToCad" ? (
              <>
                <InputBox
                  label="US Gas Price"
                  amount={usdPerGallon}
                  onAmountChange={setUsdPerGallon}
                  unitLabel="USD / gallon"
                />

                <InputBox
                  label="Canadian Gas Price"
                  amount={cadPerLitre}
                  onAmountChange={setCadPerLitre}
                  unitLabel="CAD / litre"
                  amountDisable
                />
              </>
            ) : (
              <>
                <InputBox
                  label="Canadian Gas Price"
                  amount={cadPerLitre}
                  onAmountChange={setCadPerLitre}
                  unitLabel="CAD / litre"
                />

                <InputBox
                  label="US Gas Price"
                  amount={usdPerGallon}
                  onAmountChange={setUsdPerGallon}
                  unitLabel="USD / gallon"
                  amountDisable
                />
              </>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg mt-2"
              disabled={!exchangeRate}
            >
              Convert
            </button>
          </form>
        </div>

        {/* Savings Calculator */}
        <div className="w-full max-w-md border border-gray-200 rounded-xl p-6 shadow-md bg-white space-y-4">

          <h2 className="text-xl font-semibold text-gray-800 text-center">
            Car Fuel Savings Calculator
          </h2>

          {/* Make */}
          <select
            value={selectedMake}
            onChange={(e) => {
              const make = e.target.value as Make | "";
              setSelectedMake(make);
              setSelectedModel("");
              setTankSize(null);
            }}
            className="w-full p-2 rounded border"
          >
            <option value="">Select Make</option>
            {makes.map((make) => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>

          {/* Model */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-2 rounded border"
            disabled={!selectedMake}
          >
            <option value="">Select Model</option>
            {models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          {/* Tank Size */}
          {tankSize && (
            <p className="text-sm text-gray-600">
              Tank size: <span className="font-medium">{tankSize} L</span>
            </p>
          )}

 {/* Fuel Gauge */}
<div className="w-full flex flex-col items-center mt-4">

<div className="relative w-48 h-24">
  {/* Gauge Arc */}
  <svg viewBox="0 0 100 50" className="w-full h-full">
    <path
      d="M10 50 A40 40 0 0 1 90 50"
      fill="none"
      stroke="#e5e7eb"
      strokeWidth="8"
    />
    <path
      d="M10 50 A40 40 0 0 1 90 50"
      fill="none"
      stroke="#22c55e"
      strokeWidth="8"
      strokeDasharray="100"
      strokeDashoffset={100 - fillLevel * 100}
      className="transition-all duration-300"
    />
  </svg>

  {/* Needle */}
  <div
    className="absolute left-1/2 bottom-0 w-1 h-20 bg-red-600 origin-bottom"
    style={{
      transform: `translateX(-50%) rotate(${fillLevel * 180 - 90}deg)`,
      transition: "transform 0.3s ease",
    }}
  />

  {/* Center cap */}
  <div className="absolute left-1/2 bottom-0 w-4 h-4 bg-gray-700 rounded-full transform -translate-x-1/2 translate-y-1/2" />
</div>

{/* Labels */}
<div className="flex justify-between w-48 text-xs text-gray-600 mt-1">
  <span>E</span>
  <span>1/4</span>
  <span>1/2</span>
  <span>3/4</span>
  <span>F</span>
</div>

{/* Slider Control */}
<input
  type="range"
  min={0}
  max={1}
  step={0.01}
  value={fillLevel}
  onChange={(e) => setFillLevel(Number(e.target.value))}
  className="w-full mt-4 accent-green-600"
/>

<p className="text-sm text-gray-700 mt-1">
  Fuel Level: <span className="font-medium">{(fillLevel * 100).toFixed(0)}%</span>
</p>
</div>

          <button
            onClick={calculateSavings}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg"
            disabled={!tankSize || !exchangeRate}
          >
            Calculate Savings
          </button>

          {savings !== null && (
            <p className="text-center text-lg font-semibold text-green-700">
              You saved ${savings.toFixed(2)} CAD by filling up in the U.S.
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 text-center text-gray-400 text-sm">
        Live rates from open.er-api.com
      </footer>

    </div>
  );
}
