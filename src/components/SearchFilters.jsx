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
            <option value="D">Democratic</option>
            <option value="R">Republican</option>
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
            <option value="INACTIVE">Inactive</option>
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
