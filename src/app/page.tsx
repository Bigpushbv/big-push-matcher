import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-3xl font-bold">Big Push Matcher</h1>
      <p className="text-gray-600">Welkom! Klik hieronder om naar het dashboard te gaan.</p>
      <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
        Ga naar Dashboard
      </Link>
    </div>
  );
}
