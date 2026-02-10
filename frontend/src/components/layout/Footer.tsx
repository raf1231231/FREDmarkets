export default function Footer() {
  return (
    <footer className="bg-fred-gray-100 border-t border-fred-gray-200 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-fred-gray-600">
          FREDmarkets &copy; {new Date().getFullYear()}
        </p>
        <p className="text-xs text-fred-gray-600">
          Prediction markets on Federal Reserve Economic Data &middot; Powered by Solana
        </p>
      </div>
    </footer>
  );
}
