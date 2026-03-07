"use client";

import { useState, useEffect } from "react";
import { InputBox } from "../components/InputBox";
import { carTankSizes } from "@/data/carTankSizes";
import { getTankSize } from "@/utils/getTankSize";

type Make = keyof typeof carTankSizes;
type Model<M extends Make> = keyof typeof carTankSizes[M];

// Moved outside component to satisfy ESLint
const LITRES_PER_GALLON = 3.78541;
const CACHE_KEY = "usd_to_cad_rate";
const CACHE_DURATION = 60 * 60 * 1000;

export default function Home() {
  // ⭐ Sticky header shrink state
  const [isShrunk, setIsShrunk] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsShrunk(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ⭐ Your existing state
  const [usdPerGallon, setUsdPerGallon] = useState(0);
  const [manualCadPrice, setManualCadPrice] = useState(0);
  const [convertedCadPrice, setConvertedCadPrice] = useState(0);

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const [mode, setMode] = useState<"usdToCad" | "cadToUsd">("usdToCad");

  const [selectedMake, setSelectedMake] = useState<Make | "">("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [tankSize, setTankSize] = useState<number | null>(null);

  const [startLevel, setStartLevel] = useState(0.25);
  const [endLevel, setEndLevel] = useState(1);
  const [activeGaugeLevel, setActiveGaugeLevel] = useState(endLevel);

  const [savings, setSavings] = useState<number | null>(null);

  // ⭐ Load exchange rate
  useEffect(() => {
    async function loadRate() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);

        if (cached) {
          const parsed = JSON.parse(cached);
          const isFresh = Date.now() - parsed.timestamp < CACHE_DURATION;

          if (isFresh) {
            setExchangeRate(parsed.rate);
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
      } catch (err) {
        console.error("Error fetching exchange rate:", err);
      }
    }

    loadRate();
  }, []);


  // ⭐ Auto-set tank size
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

  // ⭐ Converter logic
  const convertGasPrice = () => {
    if (!exchangeRate) return;
  
    if (mode === "usdToCad") {
      const result = (usdPerGallon / LITRES_PER_GALLON) * exchangeRate;
      setConvertedCadPrice(Number(result.toFixed(2)));
    } else {
      const result = (manualCadPrice * (1 / exchangeRate)) * LITRES_PER_GALLON;
      setUsdPerGallon(Number(result.toFixed(2)));
    }
  };
  

  // ⭐ Litres added
  const litresAdded = tankSize
    ? tankSize * Math.max(0, endLevel - startLevel)
    : 0;

  // ⭐ Savings logic
  const calculateSavings = () => {
    if (!exchangeRate || !tankSize) return;

    const usdPriceInCad = (usdPerGallon / LITRES_PER_GALLON) * exchangeRate;

    const costInCanada = litresAdded * manualCadPrice;
    const costInUS = litresAdded * usdPriceInCad;

    setSavings(costInCanada - costInUS);
  };

  const normalizedSavings =
    savings !== null && Math.abs(savings) < 0.005 ? 0 : savings;

  const makes = Object.keys(carTankSizes) as Make[];
  const models =
    selectedMake !== ""
      ? (Object.keys(carTankSizes[selectedMake as Make]) as string[])
      : [];

  // --------------------------------------------------------------------
  // ⭐ FULL PAGE LAYOUT WITH CENTERED CONTENT
  // --------------------------------------------------------------------

  return (
    <>
      {/* ⭐ Sticky Header */}
      <header
        className={`
          sticky top-0 z-50 w-full border-b border-gray-200 backdrop-blur-md
          transition-all duration-300
          ${isShrunk ? "py-2 bg-white/80 shadow-sm" : "py-5 bg-white/60"}
        `}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4">
          <h1
            className={`
              font-semibold tracking-tight transition-all duration-300
              ${isShrunk ? "text-lg" : "text-2xl"}
            `}
          >
            US Canada Gas Price Converter
          </h1>

          <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
            <button
              onClick={() =>
                document.getElementById("converter")?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600 transition"
            >
              Converter
            </button>

            <button
              onClick={() =>
                document.getElementById("savings")?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600 transition"
            >
              Savings Calculator
            </button>

            <button
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
              className="hover:text-blue-600 transition"
            >
              How It Works
            </button>
          </nav>
        </div>
      </header>

      {/* ⭐ Main Content Wrapper */}
      <main className="min-h-screen bg-gray-50 text-gray-900 px-4 pt-24 pb-10">
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">

          {/* SAVINGS CALCULATOR HIGHLIGHT */}
          <div className="w-full max-w-xl bg-green-50 border border-green-200 rounded-xl p-5 mb-10 text-center animate-fadeIn">
            <h3 className="text-xl font-semibold text-green-700">
              ⭐ New: Real Savings Calculator
            </h3>
            <p className="text-green-700 mt-1">
              See exactly how much you save by filling up in the U.S. — based on your actual car.
            </p>
          </div>

          {/* ⭐ GAS PRICE CONVERTER */}
          <section
            id="converter"
            className="w-full max-w-xl bg-white rounded-xl shadow-sm p-6 mb-12 space-y-4 animate-fadeIn mx-auto"
          >
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              Gas Price Converter
            </h2>

            {/* Mode Switch */}
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

            {/* Live Rate */}
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
              className="w-full"
            >
              {mode === "usdToCad" ? (
                <div className="grid grid-cols-1 md:grid-cols-[auto_auto_auto] gap-4 items-center justify-center">

                  {/* US Price */}
                  <div className="w-full max-w-[200px] mx-auto">
                    <InputBox
                      label="US Gas Price"
                      amount={usdPerGallon}
                      onAmountChange={setUsdPerGallon}
                      unitLabel="USD / gallon"
                    />
                  </div>

                  {/* Convert Button */}
                  <button
                    type="submit"
                    className="
                      flex items-center justify-center
                      bg-blue-600 text-white font-semibold
                      px-4 py-3 rounded-lg shadow
                      hover:bg-blue-700 transition
                      transform hover:scale-[1.03]
                      whitespace-nowrap
                    "
                    disabled={!exchangeRate}
                  >
                    USD → CAD
                  </button>

                  {/* Converted CAD Price */}
                  <div className="w-full max-w-[200px] mx-auto">
                    <InputBox
                      label="Converted CAD Price"
                      amount={convertedCadPrice}
                      onAmountChange={setConvertedCadPrice}
                      unitLabel="CAD / litre"
                      amountDisable
                    />
                  </div>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[auto_auto_auto] gap-4 items-center justify-center">

                  {/* CAD Price */}
                  <div className="w-full max-w-[200px] mx-auto">
                    <InputBox
                      label="Canadian Gas Price"
                      amount={manualCadPrice}
                      onAmountChange={setManualCadPrice}
                      unitLabel="CAD / litre"
                    />
                  </div>

                  {/* Convert Button */}
                  <button
                    type="submit"
                    className="
                      flex items-center justify-center
                      bg-blue-600 text-white font-semibold
                      px-4 py-3 rounded-lg shadow
                      hover:bg-blue-700 transition
                      transform hover:scale-[1.03]
                      whitespace-nowrap
                    "
                    disabled={!exchangeRate}
                  >
                    CAD → USD
                  </button>

                  {/* Converted USD Price */}
                  <div className="w-full max-w-[200px] mx-auto">
                    <InputBox
                      label="Converted USD Price"
                      amount={usdPerGallon}
                      onAmountChange={setUsdPerGallon}
                      unitLabel="USD / gallon"
                      amountDisable
                    />
                  </div>

                </div>
              )}
            </form>

          </section>

          {/* ⭐ SAVINGS CALCULATOR */}
          <section
            id="savings"
            className="w-full max-w-xl bg-white rounded-xl shadow-sm p-6 mb-12 space-y-4 animate-fadeIn mx-auto"
          >
            <h2 className="text-2xl font-semibold text-gray-800 text-center">
              Car Fuel Savings Calculator
            </h2>

            {/* Manual CAD Entry */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 whitespace-normal leading-tight">
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

            {/* US Price */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 font-medium">
                US Gas Price (from converter)
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {usdPerGallon === 0 ? "—" : usdPerGallon.toFixed(3)} USD / gallon
              </p>
            </div>

            {/* CAD Price */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 font-medium">
                Canadian Gas Price (Manual)
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {manualCadPrice === 0 ? "—" : manualCadPrice.toFixed(3)} CAD / litre
              </p>
            </div>

            {/* Make + Model */}
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

            {/* Fuel Gauge + Sliders */}
            <div className="w-full flex flex-col items-center mt-4">

              {/* Gauge */}
              <div className="relative w-48 h-24 mb-6">
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
                    strokeDasharray="126"
                    strokeDashoffset={126 * (1 - activeGaugeLevel)}
                    className="transition-all duration-300"
                  />
                </svg>

                <div
                  className="absolute left-1/2 bottom-0 w-1 h-20 bg-red-600"
                  style={{
                    transform: `translateX(-50%) rotate(${activeGaugeLevel * 180 - 90}deg)`,
                    transformOrigin: "50% 100%",
                    transition: "transform 0.3s ease",
                  }}
                />

                <div className="absolute left-1/2 bottom-0 w-4 h-4 bg-gray-700 rounded-full transform -translate-x-1/2 translate-y-1/2" />
              </div>

              {/* Start Level */}
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
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStartLevel(val);
                    setActiveGaugeLevel(val);
                  }}
                  className="w-full accent-blue-600"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round(startLevel * 100)}%
                </p>
              </div>

              {/* End Level */}
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
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEndLevel(val);
                    setActiveGaugeLevel(val);
                  }}
                  className="w-full accent-green-600"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {Math.round(endLevel * 100)}%
                </p>
              </div>

              {/* Litres Added */}
              {tankSize && (
                <div className="w-full mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-medium">
                    Fuel Added
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {litresAdded.toFixed(1)} L
                  </p>

                  <div className="w-full h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(endLevel - startLevel) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cost Breakdown */}
              {tankSize && (
                <div className="w-full mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Cost Breakdown</p>

<div className="flex justify-between text-sm text-gray-600">
  <span>Cost in Canada</span>
  <span>
    {(litresAdded * manualCadPrice).toFixed(2)} CAD
  </span>
</div>

<div className="flex justify-between text-sm text-gray-600">
  <span>Cost in U.S. (converted)</span>
  <span>
    {(litresAdded *
      ((usdPerGallon / 3.78541) * exchangeRate)
    ).toFixed(2)}{" "}
    CAD
  </span>
</div>
</div>
)}

{/* Calculate Savings Button */}
<button
onClick={calculateSavings}
className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
disabled={!tankSize || !exchangeRate}
>
Calculate Savings
</button>

{/* Savings Summary */}
{normalizedSavings !== null && (
<div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center animate-fadeIn">
<h3 className="text-xl font-semibold text-green-700 mb-2">
  Your Savings Summary
</h3>

<div className="space-y-2 text-gray-700">
  <p>
    <span className="font-medium">Litres Added:</span>{" "}
    {litresAdded.toFixed(2)} L
  </p>

  <p>
    <span className="font-medium">Cost in Canada:</span>{" "}
    {(litresAdded * manualCadPrice).toFixed(2)} CAD
  </p>

  <p>
    <span className="font-medium">Cost in U.S. (converted):</span>{" "}
    {(
      litresAdded *
      ((usdPerGallon / 3.78541) * exchangeRate)
    ).toFixed(2)} CAD
  </p>
</div>

<p className="text-2xl font-bold text-green-700 mt-4">
  You saved ${normalizedSavings.toFixed(2)} CAD
</p>

<p className="text-sm text-green-700 mt-1">
  Great job — that’s real money back in your pocket.
</p>
</div>
)}
</div>
</section>

{/* HERO */}
<section className="max-w-2xl text-center mb-16 animate-fadeIn">
<h1 className="text-4xl font-bold mb-4 tracking-tight">
Save Money on Gas — Instantly Compare U.S. vs Canadian Prices
</h1>
<p className="text-gray-600 text-lg leading-relaxed">
Live exchange rates, real car tank sizes, and a smart savings calculator
built for cross‑border drivers in Windsor & Detroit.
</p>
</section>

{/* WHY THIS TOOL EXISTS */}
<section className="max-w-2xl mb-16 text-center animate-fadeIn">
<h2 className="text-2xl font-semibold mb-4">Why Drivers Use This Tool</h2>
<p className="text-gray-600 leading-relaxed">
Gas prices can differ by over <span className="font-semibold">30%</span> across the border.
Exchange rates change daily. Your car’s tank size affects your real savings.
This tool does the math for you — instantly.
</p>
</section>

{/* HOW IT WORKS */}
<section id="how-it-works" className="max-w-3xl mb-16 animate-fadeIn">
<h2 className="text-2xl font-semibold text-center mb-6">How It Works</h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
<p className="text-xl font-bold mb-2">1</p>
<p className="text-gray-700">Enter U.S. or Canadian gas price</p>
</div>

<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
<p className="text-xl font-bold mb-2">2</p>
<p className="text-gray-700">Select your car to auto‑fill tank size</p>
</div>

<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
<p className="text-xl font-bold mb-2">3</p>
<p className="text-gray-700">Adjust fuel levels and see real savings</p>
</div>
</div>
</section>

{/* FOOTER */}
<footer className="text-center text-gray-500 text-sm mt-10">
<p>Made in Windsor 🇨🇦</p>
<p className="mt-1">© {new Date().getFullYear()} Gas Price Converter</p>
</footer>

</div>
</main>
</>
);
}
