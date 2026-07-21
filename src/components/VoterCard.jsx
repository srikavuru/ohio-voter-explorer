import { useEffect, useState } from 'react';
import { getVoterDetail } from '../lib/api';

export default function VoterCard({ voterId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getVoterDetail(voterId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [voterId]);

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-900 p-4">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-gray-900 p-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const { voter, voteHistory } = data;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-900 p-4">
        <h2 className="text-sm font-medium text-gray-300">
          {voter.last_name}, {voter.first_name} {voter.middle_name}
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd className="text-gray-200">{voter.voter_status}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Party (last primary)</dt>
            <dd className="text-gray-200">{voter.party_affiliation || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Address</dt>
            <dd className="text-gray-200">
              {voter.residential_address1}, {voter.residential_city} {voter.residential_zip}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Precinct</dt>
            <dd className="text-gray-200">
              {voter.precinct_name} ({voter.precinct_code})
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Registered</dt>
            <dd className="text-gray-200">{voter.registration_date}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-lg bg-gray-900 p-4">
        <h2 className="text-sm font-medium text-gray-300">Vote History</h2>
        {voteHistory.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No recorded ballots.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {voteHistory.map((v) => (
              <li key={v.raw_column} className="flex justify-between text-gray-400">
                <span>
                  {v.election_type} — {v.election_date}
                </span>
                <span className="text-gray-200">{v.ballot_value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
