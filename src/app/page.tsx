import { getAllSetups } from "@/lib/setups";
import Gallery from "@/components/Gallery";

export default function Home() {
  const setups = getAllSetups();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Community Config Gallery
        </h1>
        <p className="text-zinc-400">
          Discover and share real-world OpenClaw setups. Browse configurations
          from the community, copy what works, and submit your own.
        </p>
      </div>

      <Gallery setups={setups} />
    </div>
  );
}
