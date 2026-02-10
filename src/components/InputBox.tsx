// src/components/InputBox.tsx

import { useState, useEffect } from "react";

interface InputBoxProps {
  label: string;
  amount: number;
  onAmountChange: (amount: number) => void;
  unitLabel?: string;
  amountDisable?: boolean;
}

export function InputBox({
  label,
  amount,
  onAmountChange,
  unitLabel,
  amountDisable = false,
}: InputBoxProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (amount === 0) {
      setInputValue("");
    } else {
      setInputValue(String(amount));
    }
  }, [amount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Always update visible text
    setInputValue(value);

    // Allow empty
    if (value === "") {
      onAmountChange(0);
      return;
    }

    // Allow "." → treat as 0
    if (value === ".") {
      onAmountChange(0);
      return;
    }

    // Allow "1." → treat as 1
    if (/^\d+\.$/.test(value)) {
      onAmountChange(parseFloat(value));
      return;
    }

    // Allow full decimals
    if (/^\d*\.?\d*$/.test(value)) {
      const numeric = parseFloat(value);
      onAmountChange(isNaN(numeric) ? 0 : numeric);
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          disabled={amountDisable}
          className="flex-1 outline-none text-gray-900 bg-transparent"
        />

        {unitLabel && (
          <span className="ml-2 text-gray-500 text-sm">{unitLabel}</span>
        )}
      </div>
    </div>
  );
}
