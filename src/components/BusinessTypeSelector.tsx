import { useState } from "react";
import { businessTypes } from "~/lib/mock-data";

interface BusinessTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BusinessTypeSelector({ value, onChange }: BusinessTypeSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__custom__") {
      setIsCustom(true);
      onChange("");
    } else {
      setIsCustom(false);
      onChange(e.target.value);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Business Type
      </label>
      {!isCustom ? (
        <select
          value={value}
          onChange={handleSelectChange}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Select a business type...</option>
          {businessTypes.map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
          <option value="__custom__">Custom...</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={customValue}
            onChange={handleCustomInput}
            placeholder="Enter your business type..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <button
            onClick={() => {
              setIsCustom(false);
              setCustomValue("");
              onChange("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}