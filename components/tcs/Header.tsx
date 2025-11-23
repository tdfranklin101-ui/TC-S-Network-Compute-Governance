export default function Header({ title }) {
  return (
    <div className="text-center space-y-2 mb-6">
      <h1 className="text-5xl font-bold text-yellow-300">{title}</h1>
      <p className="text-lg text-gray-300">Part of the TC-S Network</p>
    </div>
  );
}
