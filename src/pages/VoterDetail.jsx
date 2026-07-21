import { useParams } from 'react-router-dom';
import VoterCard from '../components/VoterCard';

export default function VoterDetail() {
  const { id } = useParams();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Voter Detail</h1>
      <div className="mt-6">
        <VoterCard voterId={id} />
      </div>
    </div>
  );
}
