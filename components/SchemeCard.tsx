interface SchemeCardProps {
  scheme: {
    scheme: {
      id: string
      name: string
      description: string
      subsidyDetail: string
      sourceUrl: string
    }
    reason: string
  }
}

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const { scheme: s, reason } = scheme

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-indigo-600 text-lg">🏦</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{s.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>
          </div>
        </div>

        {/* Subsidy detail */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">💰 Subsidy Details</p>
          <p className="text-sm text-gray-600">{s.subsidyDetail}</p>
        </div>

        {/* Why you qualify */}
        <div className="bg-green-50 rounded-lg p-3 mb-3">
          <p className="text-sm text-green-800">
            <span className="font-medium">✓ Why you qualify:</span> {reason}
          </p>
        </div>

        {/* Source link */}
        <a
          href={s.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Learn more →
        </a>
      </div>
    </div>
  )
}
