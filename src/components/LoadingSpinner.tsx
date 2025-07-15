import { Loader2 } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center relative overflow-hidden">
      {/* Animated Blobs in Background */}
      <div className="absolute w-72 h-72 bg-indigo-300 rounded-full opacity-30 animate-ping -top-10 -left-10" />
      <div className="absolute w-72 h-72 bg-blue-300 rounded-full opacity-30 animate-ping -bottom-10 -right-10" />

      {/* Glassy Floating Loader Card */}
      <div className="relative z-10 backdrop-blur-xl bg-white/60 border border-white/20 rounded-xl shadow-2xl p-10 flex flex-col items-center space-y-6 animate-fadeIn">
        {/* Spinner Icon with Pulse */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-300 border-t-indigo-600 animate-spin" />
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-700" />
        </div>

        {/* Animated Loading Dots */}
        <div className="flex text-lg font-medium text-indigo-800 space-x-1">
          <span>Loading</span>
          <span className="animate-bounce delay-0">.</span>
          <span className="animate-bounce delay-150">.</span>
          <span className="animate-bounce delay-300">.</span>
        </div>

        {/* Subtext */}
        <p className="text-sm text-gray-700 text-center max-w-xs animate-pulse">
          Fetching everything you need to get started — hang tight!
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
