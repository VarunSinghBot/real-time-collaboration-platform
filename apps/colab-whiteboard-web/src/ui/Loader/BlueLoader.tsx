export default function BlueLoader() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-300 border-t-transparent animate-spin animation-delay-150"></div>
      </div>
    </div>
  );
}

