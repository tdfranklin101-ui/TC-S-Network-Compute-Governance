import WPCPanel from '@/components/tcs/WPCPanel';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 p-10 space-y-6">
      <h1 className="text-4xl font-bold text-yellow-300">TC-S: Compute Governance</h1>
      <p className="text-gray-300">Next.js App Router is active.</p>
      <WPCPanel />
    </main>
  );
}
