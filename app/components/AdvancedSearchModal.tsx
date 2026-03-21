"use client";

interface AdvancedSearchModalProps {
  show: boolean;
  onClose: () => void;
  tempUnit: "C" | "F";
  minLowTemp: number | null;
  setMinLowTemp: (v: number | null) => void;
  maxHighTemp: number | null;
  setMaxHighTemp: (v: number | null) => void;
  advancedMaxPrecip: number | null;
  setAdvancedMaxPrecip: (v: number | null) => void;
}

export default function AdvancedSearchModal({
  show,
  onClose,
  tempUnit,
  minLowTemp,
  setMinLowTemp,
  maxHighTemp,
  setMaxHighTemp,
  advancedMaxPrecip,
  setAdvancedMaxPrecip,
}: AdvancedSearchModalProps) {
  const lowMin = tempUnit === "F" ? 32 : 0;
  const lowMax = tempUnit === "F" ? 80 : 27;
  const lowDefault = tempUnit === "F" ? 55 : 13;

  const highMin = tempUnit === "F" ? 60 : 16;
  const highMax = tempUnit === "F" ? 110 : 43;
  const highDefault = tempUnit === "F" ? 90 : 32;

  if (!show) return null;

  const Toggle = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        active ? "bg-blue-600" : "bg-gray-300"
      }`}
      aria-label={active ? "Disable" : "Enable"}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          active ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">
        <div className="max-w-4xl mx-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Advanced Filters</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            {/* Min Overnight Low */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Nights no colder than
                  {minLowTemp !== null && (
                    <span className="ml-2 text-blue-600 font-semibold">{minLowTemp}°{tempUnit}</span>
                  )}
                </label>
                <Toggle
                  active={minLowTemp !== null}
                  onToggle={() => setMinLowTemp(minLowTemp === null ? lowDefault : null)}
                />
              </div>
              {minLowTemp !== null && (
                <>
                  <input
                    type="range"
                    min={lowMin}
                    max={lowMax}
                    value={minLowTemp}
                    onChange={(e) => setMinLowTemp(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{lowMin}°{tempUnit}</span>
                    <span>{lowMax}°{tempUnit}</span>
                  </div>
                </>
              )}
            </div>

            {/* Max Daytime High */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Days no hotter than
                  {maxHighTemp !== null && (
                    <span className="ml-2 text-blue-600 font-semibold">{maxHighTemp}°{tempUnit}</span>
                  )}
                </label>
                <Toggle
                  active={maxHighTemp !== null}
                  onToggle={() => setMaxHighTemp(maxHighTemp === null ? highDefault : null)}
                />
              </div>
              {maxHighTemp !== null && (
                <>
                  <input
                    type="range"
                    min={highMin}
                    max={highMax}
                    value={maxHighTemp}
                    onChange={(e) => setMaxHighTemp(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{highMin}°{tempUnit}</span>
                    <span>{highMax}°{tempUnit}</span>
                  </div>
                </>
              )}
            </div>

            {/* Precise Rain Limit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Precise rain limit
                  {advancedMaxPrecip !== null && (
                    <span className="ml-2 text-blue-600 font-semibold">{advancedMaxPrecip}mm/mo</span>
                  )}
                </label>
                <Toggle
                  active={advancedMaxPrecip !== null}
                  onToggle={() => setAdvancedMaxPrecip(advancedMaxPrecip === null ? 80 : null)}
                />
              </div>
              {advancedMaxPrecip !== null && (
                <>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={advancedMaxPrecip}
                    onChange={(e) => setAdvancedMaxPrecip(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Dry 30</span>
                    <span>Low 60</span>
                    <span>Some 120</span>
                    <span>200mm</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => {
                setMinLowTemp(null);
                setMaxHighTemp(null);
                setAdvancedMaxPrecip(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
