import SearchFilters from '../components/SearchFilters';
import ResultsTable from '../components/ResultsTable';

export default function VoterSearch() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Voter Search</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <SearchFilters />
        </div>
        <div className="lg:col-span-3">
          <ResultsTable />
        </div>
      </div>
    </div>
  );
}
