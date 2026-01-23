import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8 flex gap-12 items-center justify-center min-h-screen text-purple-700 bg-white">
      <div className="border border-dashbed border-purple-400 h-100 w-100 flex gap-12 items-center justify-center p-8 rounded-sm">
        <Link href="/login" 
          className="border border-purple-700 transition-all  cursor-pointer px-12 py-4 rounded-full hover:shadow-[8px_8px_0px_0px_rgba(147,51,234,1)]"> 
          Login 
        </Link>

        <Link href="/signup" 
          className="border border-purple-700 transition-all  cursor-pointer px-12 py-4 rounded-full hover:shadow-[8px_8px_0px_0px_rgba(147,51,234,1)]"> 
          Signup 
        </Link>
      </div>
    </main>
  );
}
