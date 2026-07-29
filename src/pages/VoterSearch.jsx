import { useState } from 'react';
import SearchFilters from '../components/SearchFilters';
import ResultsTable from '../components/ResultsTable';
import { searchVoters } from '../lib/api';

const EMPTY_FILTERS = {
  q: '',
  party: '',
  status: '',
  precinct: '',
  congressional: '',
  stateSenate: '',
  stateHouse: '',
  tenure: '',
  housing: '',
};

function toParams(filters, page) {
  const params = { page };
  if (filters.q) params.q = filters.q;
  if (filters.party) params.party = filters.party;
  if (filters.status) params.status = filters.status;
  if (filters.precinct) params.precinct = filters.precinct;
  if (filters.congressional) params.congressional = filters.congressional;
  if (filters.stateSenate) params.stateSenate = filters.stateSenate;
  if (filters.stateHouse) params.stateHouse = filters.stateHouse;
  if (filters.tenure) params.tenure = filters.tenure;
  if (filters.housing) params.housing = filters.housing;
  return params;
}

export default function VoterSearch() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // Filters as of the last submitted search. Paging reuses these so that edits
  // typed since then don't silently page through a different query.
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState(null);
  const [total, setTotal] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runSearch(searchFilters, nextPage) {
    setLoading(true);
    setError(null);
    try {
      const data = await searchVoters(toParams(searchFilters, nextPage));
      setResults(data.results);
      setTotal(data.total);
      setPage(data.page);
      setLimit(data.limit);
      setActiveFilters(searchFilters);
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
          <SearchFilters
            filters={filters}
            onChange={setFilters}
            onSubmit={() => runSearch(filters, 1)}
          />
        </div>
        <div className="lg:col-span-3">
          <ResultsTable
            results={results}
            total={total}
            page={page}
            limit={limit}
            loading={loading}
            error={error}
            onPageChange={(nextPage) => runSearch(activeFilters, nextPage)}
          />
        </div>
      </div>
    </div>
  );
}
