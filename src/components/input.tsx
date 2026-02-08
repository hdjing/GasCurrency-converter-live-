import { useId } from "react";

interface InputBoxProps {
  label: string;
  className?: string;
  amount: number;
  onAmountChange: (amount: number) => void;
  unitLabel?: string; // 👈 make optional to prevent TS errors
  amountDisable?: boolean;
}

export default function InputBox({
  className = "",
  label,
  amount,
  onAmountChange,
  unitLabel = "", // 👈 default value
  amountDisable = false,
}: InputBoxProps) {

  const reactId = useId();

  return (
    <div className={`bg-white p-3 rounded-lg text-sm flex ${className}`}>
      <div className="w-1/2">

        <label
          htmlFor={reactId}
          className="text-black/40 mb-2 inline-block"
        >
          {label}
        </label>

        <input
          id={reactId}
          className="outline-none w-full bg-transparent py-1.5"
          type="number"
          step="0.01"
          disabled={amountDisable}
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value))}
        />
      </div>

      <div className="w-1/2 flex items-end justify-end text-right">
        <span className="text-black/50 text-sm">{unitLabel}</span>
      </div>
    </div>
  );
}
