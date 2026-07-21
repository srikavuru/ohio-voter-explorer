import NLQueryBox from '../components/NLQueryBox';

export default function AskAI() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-100">Ask AI</h1>
      <p className="mt-2 text-gray-400">
        Ask natural-language questions over the voter dataset.
      </p>
      <div className="mt-6">
        <NLQueryBox />
      </div>
    </div>
  );
}
