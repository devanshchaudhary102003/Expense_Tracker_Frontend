export default function Logo({ size = 36, withText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="url(#g)" />
        <path
          d="M13 22.5l4 4 10-11"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="#1fb573" />
            <stop offset="1" stopColor="#11754b" />
          </linearGradient>
        </defs>
      </svg>
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-slate-900">SpendSmart</span>
          <span className="text-[10px] font-medium text-slate-500 -mt-0.5">Track. Budget. Save.</span>
        </div>
      )}
    </div>
  );
}
