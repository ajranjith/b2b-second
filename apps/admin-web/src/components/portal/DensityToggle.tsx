"use client";

type DensityToggleProps = {
  value: "comfortable" | "dense";
  onChange: (value: "comfortable" | "dense") => void;
};

export function DensityToggle({ value, onChange }: DensityToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {(["comfortable", "dense"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-3 py-1 text-xs font-semibold rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2 ${
            value === option ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {option === "comfortable" ? "Comfortable" : "Dense"}
        </button>
      ))}
    </div>
  );
}
