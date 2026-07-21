import { useState } from 'react';
import SearchFilters from '../components/SearchFilters';
import ResultsTable from '../components/ResultsTable';
import { searchVoters } from '../lib/api';

const EMPTY_FILTERS = { q: '', party: '', status: '', precinct: '' };

export default function VoterSearch() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState(null);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.party) params.party = filters.party;
      if (filters.status) params.status = filters.status;
      if (filters.precinct) params.precinct = filters.precinct;
      const data = await searchVoters(params);
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Voter Search</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <SearchFilters filters={filters} onChange={setFilters} onSubmit={handleSearch} />
        </div>
        <div className="lg:col-span-3">
          <ResultsTable results={results} total={total} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}
