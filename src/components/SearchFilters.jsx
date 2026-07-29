// District codes present in the loaded Franklin County file. Every row has all
// three, so there is no blank option to account for. Regenerate after a reimport:
//   SELECT DISTINCT congressional_district FROM voters ORDER BY 1;
const DISTRICTS = [
  { field: 'congressional', label: 'Congressional district', options: ['03', '15'] },
  { field: 'stateSenate', label: 'State senate district', options: ['03', '15', '16', '25'] },
  {
    field: 'stateHouse',
    label: 'State house district',
    options: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  },
];

export default function SearchFilters({ filters, onChange, onSubmit }) {
  function set(field, value) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-lg bg-gray-900 p-4"
    >
      <h2 className="text-sm font-medium text-gray-300">Filters</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-gray-500">County</label>
          <p className="rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-500">
            Franklin (only county loaded)
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Name or address</label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="e.g. Hughes or Drivemere"
            className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Party (last primary pulled)</label>
          <select
            value={filters.party}
            onChange={(e) => set('party', e.target.value)}
            className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none"
          >
            <option value="">All</option>
            <option value="NONE">None (no primary pulled)</option>
            <option value="D">Democratic</option>
            <option value="R">Republican</option>
            <option value="L">Libertarian</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Status</label>
          <select
            value={filters.status}
            onChange={(e) => set('status', e.target.value)}
            className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="CONFIRMATION">Confirmation (notice sent)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Precinct</label>
          <input
            type="text"
            value={filters.precinct}
            onChange={(e) => set('precinct', e.target.value)}
            placeholder="e.g. 25-ATZ"
            className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Years registered</label>
          <select
            value={filters.tenure}
            onChange={(e) => set('tenure', e.target.value)}
            className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none"
          >
            <option value="">Any</option>
            <option value="0-2">Under 2 years</option>
            <option value="3-5">2–5 years</option>
            <option value="6-10">5–10 years</option>
            <option value="11-20">10–20 years</option>
            <option value="20+">Over 20 years</option>
          </select>
          <p className="mt-1 text-[10px] leading-tight text-gray-600">
            Time as a registered voter, not time at this address — Ohio keeps the
            original date when you move in-state.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Housing type</label>
          <select
            value={filters.housing}
            onChange={(e) => set('housing', e.target.value)}
            className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none"
          >
            <option value="">Any</option>
            <option value="SINGLE">House (no unit no.)</option>
            <option value="MULTI">Apartment / unit</option>
          </select>
        </div>
        {DISTRICTS.map(({ field, label, options }) => (
          <div key={field}>
            <label className="mb-1 block text-xs text-gray-500">{label}</label>
            <select
              value={filters[field]}
              onChange={(e) => set(field, e.target.value)}
              className="w-full rounded-md bg-gray-800 px-2 py-1.5 text-sm text-gray-100 focus:outline-none"
            >
              <option value="">All</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="submit"
          className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm text-gray-100 hover:bg-gray-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}
