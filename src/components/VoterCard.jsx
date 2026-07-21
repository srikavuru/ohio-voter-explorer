export default function VoterCard({ voterId }) {
  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <h2 className="text-sm font-medium text-gray-300">Voter {voterId}</h2>
      <p className="mt-4 text-sm text-gray-500">Record details go here.</p>
    </div>
  );
}
