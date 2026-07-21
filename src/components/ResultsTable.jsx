import { Link } from 'react-router-dom';

export default function ResultsTable({ results, total, loading, error }) {
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
                <td className="py-2 pr-4 text-gray-400">{voter.precinct_code}</td>
                <td className="py-2 pr-4 text-gray-400">{voter.party_affiliation || '—'}</td>
                <td className="py-2 text-gray-400">{voter.voter_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
