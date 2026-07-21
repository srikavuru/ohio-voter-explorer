import { useState } from 'react';

export default function NLQueryBox() {
  const [question, setQuestion] = useState('');

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <textarea
        className="w-full rounded-md bg-gray-950 p-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
        rows={3}
        placeholder="e.g. How many active voters in Franklin County voted in the last 3 general elections?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button
        type="button"
        className="mt-3 rounded-md bg-gray-800 px-4 py-2 text-sm text-gray-100 hover:bg-gray-700"
      >
        Ask
      </button>
    </div>
  );
}
