export default function PageSizeSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span>Por página:</span>
      {[10, 50, 100].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-2 py-1 rounded ${value === n ? 'bg-indigo-600 text-white' : 'border hover:bg-gray-50'}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
