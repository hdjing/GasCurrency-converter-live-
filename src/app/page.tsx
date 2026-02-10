"use client";
import { useState, useEffect } from "react";
import { InputBox } from "../components/InputBox";
import { carTankSizes } from "@/data/carTankSizes";
import { getTankSize } from "@/utils/getTankSize";

type Make = keyof typeof carTankSizes;
type Model<M extends Make> = keyof typeof carTankSizes[M];

export default function Home() {
  // Numeric state
  const [usdPerGallon, setUsdPerGallon] = useState(0);
  const [manualCadPrice, setManualCadPrice] = useState(0);
  const [convertedCadPrice, setConvertedCadPrice] = useState(0);

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [mode, setMode] = useState<"usdToCad" | "cadToUsd">("usdToCad");

  const [selectedMake, setSelectedMake] = useState<Make | "">("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tankSize, setTankSize] = useState<number | null>(null);
  const [fillLevel, setFillLevel] = useState(0.5);
  const [startLevel, setStartLevel] = useState(0.25); // default quarter tank
  const [endLevel, setEndLevel] = useState(1);        // default full tank

  const [savings, setSavings] = useState<number | null>(null);

  const LITRES_PER_GALLON = 3.78541;
  const CACHE_KEY = "usd_to_cad_rate";
  const CACHE_DURATION = 60 * 60 * 1000;

  // Load exchange rate
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

  // Auto-set tank size
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

  // Converter logic
  const convertGasPrice = () => {
    if (!exchangeRate) return;

    if (mode === "usdToCad") {
      const result = (usdPerGallon / LITRES_PER_GALLON) * exchangeRate;
      setConvertedCadPrice(result);
    } else {
      const result = (manualCadPrice * (1 / exchangeRate)) * LITRES_PER_GALLON;
      setUsdPerGallon(result);
    }
  };

  // Savings logic
  const calculateSavings = () => {
    if (!exchangeRate || !tankSize) return;

    const litresAdded = tankSize * Math.max(0, endLevel - startLevel);


    const usdPrice = usdPerGallon;
    const cadPrice = manualCadPrice;

    const usdPriceInCad = (usdPrice / LITRES_PER_GALLON) * exchangeRate;

    const costInCanada = litresAdded * cadPrice;
    const costInUS = litresAdded * usdPriceInCad;
    
    setSavings(costInCanada - costInUS);

  };

  // Fix negative zero
  const normalizedSavings =
  savings !== null && Math.abs(savings) < 0.005 ? 0 : savings;


  const makes = Object.keys(carTankSizes) as Make[];
  const models =
    selectedMake !== ""
      ? (Object.keys(
          carTankSizes[selectedMake as Make]
        ) as string[])
      : [];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-gray-50 to-white">

      <header className="pt-12 text-center">
        <h1 className="text-4xl font-semibold text-gray-800 tracking-tight">
          Gas Price Converter
        </h1>
        <p className="text-gray-500 mt-2">
          Convert fuel prices and calculate cross-border savings
        </p>
      </header>

      <main className="w-full flex flex-col items-center px-4 space-y-10">

        {/* Converter */}
        <div className="w-full max-w-md border border-gray-200 rounded-xl p-6 shadow-md bg-white space-y-4">

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

          {exchangeRate && (
            <p className="text-sm text-gray-600 text-center">
              {mode === "usdToCad" ? (
                <>Live rate: <span className="font-medium">1 USD = {exchangeRate.toFixed(3)} CAD</span></>
              ) : (
                <>Live rate: <span className="font-medium">1 CAD = {(1 / exchangeRate).toFixed(3)} USD</span></>
              )}
            </p>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                Canadian Gas Price (Manual Entry)
              </p>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                Manual Mode
              </span>
            </div>

            <InputBox
              label="CAD Price per Litre (Manual)"
              amount={manualCadPrice}
              onAmountChange={setManualCadPrice}
              unitLabel="CAD / litre"
            />
          </div>

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
                  label="Converted CAD Price"
                  amount={convertedCadPrice}
                  onAmountChange={setConvertedCadPrice}
                  unitLabel="CAD / litre"
                  amountDisable
                />
              </>
            ) : (
              <>
                <InputBox
                  label="Canadian Gas Price (Manual)"
                  amount={manualCadPrice}
                  onAmountChange={setManualCadPrice}
                  unitLabel="CAD / litre"
                />

                <InputBox
                  label="Converted USD Price"
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

<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
  <p className="text-sm text-gray-700 font-medium">
    US Gas Price (from converter)
  </p>
  <p className="text-lg font-semibold text-gray-900 mt-1">
    {usdPerGallon === 0 ? "—" : usdPerGallon.toFixed(3)} USD / gallon
  </p>
</div>

<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
  <p className="text-sm text-gray-700 font-medium">
    Canadian Gas Price (Manual)
  </p>
  <p className="text-lg font-semibold text-gray-900 mt-1">
    {manualCadPrice === 0 ? "—" : manualCadPrice.toFixed(3)} CAD / litre
  </p>
</div>

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

{tankSize && (
  <p className="text-sm text-gray-600">
    Tank size: <span className="font-medium">{tankSize} L</span>
  </p>
)}

{/* Fuel Gauge */}
<div className="w-full flex flex-col items-center mt-4">

  {/* ENDING LEVEL GAUGE */}
  <div className="relative w-48 h-24 mb-6">
    <svg viewBox="0 0 100 50" className="w-full h-full">
      {/* Background arc */}
      <path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
      />

      {/* Green fill arc (ending level) */}
      <path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke="#22c55e"
        strokeWidth="8"
        strokeDasharray="126"
        strokeDashoffset={126 * (1 - endLevel)}
        className="transition-all duration-300"
      />
    </svg>

    {/* Needle */}
    <div
      className="absolute left-1/2 bottom-0 w-1 h-20 bg-red-600"
      style={{
        transform: `translateX(-50%) rotate(${endLevel * 180 - 90}deg)`,
        transformOrigin: "50% 100%",
        transition: "transform 0.3s ease",
      }}
    />

    {/* Needle pivot */}
    <div className="absolute left-1/2 bottom-0 w-4 h-4 bg-gray-700 rounded-full transform -translate-x-1/2 translate-y-1/2" />
  </div>

  {/* START LEVEL SLIDER */}
  <div className="w-full mb-4">
    <p className="text-sm text-gray-700 font-medium mb-1">
      Starting Fuel Level
    </p>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={startLevel}
      onChange={(e) => setStartLevel(Number(e.target.value))}
      className="w-full accent-blue-600"
    />
    <p className="text-xs text-gray-600 mt-1">
      {Math.round(startLevel * 100)}%
    </p>
  </div>

  {/* END LEVEL SLIDER */}
  <div className="w-full">
    <p className="text-sm text-gray-700 font-medium mb-1">
      Ending Fuel Level (after filling)
    </p>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={endLevel}
      onChange={(e) => setEndLevel(Number(e.target.value))}
      className="w-full accent-green-600"
    />
    <p className="text-xs text-gray-600 mt-1">
      {Math.round(endLevel * 100)}%
    </p>
  </div>

</div>

<button
  onClick={calculateSavings}
  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg"
  disabled={!tankSize || !exchangeRate}
>
  Calculate Savings
</button>

{normalizedSavings !== null && (
  <p className="text-center text-lg font-semibold text-green-700">
    You saved ${normalizedSavings.toFixed(2)} CAD by filling up in the U.S.
  </p>
)}

</div>

      </main>

      <footer className="w-full py-4 text-center text-sm text-gray-500">
        &copy; 2024 Gas Price Converter. All rights reserved.
      </footer>
    </div>
  );
}