import React from "react";

interface InputBoxProps {
  label: string;
  amount: number;
  onAmountChange: (value: number) => void;
  unitLabel: string;
  amountDisable?: boolean;
}

export function InputBox({
  label,
  amount,
  onAmountChange,
  unitLabel,
  amountDisable = false,
}: InputBoxProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label */}
      <label className="text-sm font-medium text-gray-700 leading-tight">
        {label}
      </label>

      {/* Input wrapper */}
      <div className="relative">
        {/* Input */}
        <input type="number" value={amount === 0 ? "" : 
        amount} onChange={(e) => { const raw = e.target.value; 
        onAmountChange(raw === "" ? 0 : Number(raw)); }} disabled={amountDisable} 
        className=" w-full border border-gray-300 rounded-lg py-2 pr-24 pl-3 text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 appearance-none shadow-sm hover:shadow focus:shadow-md transition-shadow " 
        step="0.01" />

        {/* Inline unit label */}
        <span
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-sm text-gray-600
            pointer-events-none
            whitespace-nowrap
          "
        >
          {unitLabel}
        </span>
      </div>
    </div>
  );
}

