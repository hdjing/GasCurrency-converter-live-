"use client";
import { SetStateAction, useState } from "react";
import { InputBox } from "../components/exportFiles";

export default function Home() {
  const [usdPerGallon, setUsdPerGallon] = useState(0);
  const [cadPerLitre, setCadPerLitre] = useState(0);

  const USD_TO_CAD = 1.36;        // temporary fixed rate
  const LITRES_PER_GALLON = 3.78541;

  const convertGasPrice = () => {
    const result =
      (usdPerGallon / LITRES_PER_GALLON) * USD_TO_CAD;

    setCadPerLitre(result);
  };

  return (
    <div
      className="w-full h-screen flex flex-wrap justify-center items-center bg-cover bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://ideogram.ai/assets/progressive-image/balanced/response/PWnkG22CQIChtzCWTkEG5A')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
      }}
    >
      <div className="w-full">
        <div className="w-full max-w-md mx-auto border border-gray-60 rounded-lg p-5 backdrop-blur-sm bg-white/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              convertGasPrice();
            }}
          >
            <div className="w-full mb-4">
              
            <InputBox
            label="US Gas Price"
            amount={usdPerGallon}
            onAmountChange={setUsdPerGallon}
            unitLabel="USD / gallon"
/>

              
            </div>

            <div className="w-full mb-4">
            <InputBox
                label="Canadian Gas Price"
                amount={cadPerLitre}
                onAmountChange={(val: number) => setCadPerLitre(val)}
                unitLabel="CAD / litre"
                amountDisable
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg"
            >
              Convert USD / gallon → CAD / litre
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
