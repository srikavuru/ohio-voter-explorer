import { Link } from 'react-router-dom';

export default function ResultsTable({
  results,
  total,
  page,
  limit,
  loading,
  error,
  onPageChange,
}) {
  const totalPages = total && limit ? Math.ceil(total / limit) : 1;
  const firstRow = (page - 1) * limit + 1;
  const lastRow = Math.min(page * limit, total);

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-300">Results</h2>
        {typeof total === 'number' && (
          <span className="text-xs text-gray-500">
            {total.toLocaleString()} match{total === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && <p className="mt-4 text-sm text-gray-500">Searching...</p>}

      {!loading && !error && (!results || results.length === 0) && (
        <p className="mt-4 text-sm text-gray-500">
          {results === null ? 'No search performed yet.' : 'No matches.'}
        </p>
      )}

      {!loading && !error && results && results.length > 0 && (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500">
              <th className="pb-2 pr-4">Name</th>
              <th className="pb-2 pr-4">Address</th>
              <th className="pb-2 pr-4" title="Years since first registering to vote — not years at this address">
                Registered
              </th>
              <th className="pb-2 pr-4">Housing</th>
              <th className="pb-2 pr-4">Precinct</th>
              <th className="pb-2 pr-4">Party</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {results.map((voter) => (
              <tr key={voter.sos_voterid}>
                <td className="py-2 pr-4">
                  <Link to={`/voter/${voter.sos_voterid}`} className="text-gray-100 hover:underline">
                    {voter.last_name}, {voter.first_name}
                  </Link>
                </td>
                <td className="py-2 pr-4 text-gray-400">
                  {voter.residential_address1}, {voter.residential_city} {voter.residential_zip}
                </td>
                <td
                  className="py-2 pr-4 tabular-nums text-gray-400"
                  title={`First registered ${voter.registration_date}`}
                >
                  {voter.years_registered === null ? '—' : `${voter.years_registered}y`}
                </td>
                <td className="py-2 pr-4 text-gray-400">
                  {voter.housing_type === 'MULTI' ? 'Apt/unit' : 'House'}
                </td>
                <td className="py-2 pr-4 text-gray-400">{voter.precinct_code}</td>
                <td className="py-2 pr-4 text-gray-400">{voter.party_affiliation || '—'}</td>
                <td className="py-2 text-gray-400">{voter.voter_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && results && results.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
          <span className="text-xs text-gray-500">
            Showing {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of{' '}
            {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-100 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-800"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page.toLocaleString()} of {totalPages.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-100 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
