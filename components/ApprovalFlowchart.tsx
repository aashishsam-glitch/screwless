'use client'

interface ApprovalFlowchartProps {
  currentStatus: string
  dependsOnName?: string | null
  isDependencyMet?: boolean
}

export default function ApprovalFlowchart({
  currentStatus,
  dependsOnName,
  isDependencyMet = true,
}: ApprovalFlowchartProps) {
  const steps = [
    { id: 'docs', label: '1. Documents Attached', desc: 'Vault docs linked' },
    { id: 'submitted', label: '2. Application Submitted', desc: 'Routed to dept queue' },
    { id: 'in_review', label: '3. Officer Review', desc: 'Verification & audit' },
    { id: 'decision', label: '4. Statutory Decision', desc: 'Approved / Info / Reject' },
  ]

  const getStepState = (index: number) => {
    if (currentStatus === 'not_started') {
      return index === 0 ? 'current' : 'upcoming'
    }
    if (currentStatus === 'submitted') {
      if (index <= 1) return 'completed'
      if (index === 2) return 'current'
      return 'upcoming'
    }
    if (currentStatus === 'in_review' || currentStatus === 'info_requested') {
      if (index <= 1) return 'completed'
      if (index === 2) return 'current'
      return 'upcoming'
    }
    if (currentStatus === 'approved' || currentStatus === 'rejected') {
      return 'completed'
    }
    return 'upcoming'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>🗺️</span> Approval Workflow Sequence
      </h3>

      {dependsOnName && (
        <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
          isDependencyMet 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span>{isDependencyMet ? '✓' : '🔒'}</span>
          <div>
            <span className="font-semibold">Prerequisite Approval:</span> {dependsOnName}
            {!isDependencyMet && ' (Must be approved before proceeding)'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
        {steps.map((step, idx) => {
          const state = getStepState(idx)
          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border text-left transition-all ${
                state === 'completed'
                  ? 'bg-green-50/70 border-green-200 text-green-900'
                  : state === 'current'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-100'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">
                  {state === 'completed' ? '✓ ' : ''}
                  {step.label}
                </span>
              </div>
              <p className="text-[11px] opacity-80">{step.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
