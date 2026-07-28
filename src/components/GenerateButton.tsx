interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  businessType: string;
}

export default function GenerateButton({ onClick, loading, disabled, businessType }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading || !businessType}
      className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all ${
        disabled || loading || !businessType
          ? "cursor-not-allowed bg-gray-400"
          : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98]"
      }`}
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Generate Leads
        </>
      )}
    </button>
  );
}