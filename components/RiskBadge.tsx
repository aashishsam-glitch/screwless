interface RiskBadgeProps {
  riskCategory: string
}

const RISK_CONFIG: Record<string, { level: string; bgColor: string; textColor: string }> = {
  green: { level: 'Low', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  white: { level: 'Low', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  orange: { level: 'Medium', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  red: { level: 'High', bgColor: 'bg-red-100', textColor: 'text-red-800' },
}

export default function RiskBadge({ riskCategory }: RiskBadgeProps) {
  const config = RISK_CONFIG[riskCategory] || RISK_CONFIG.green
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.level === 'Low' && '🟢'}
      {config.level === 'Medium' && '🟠'}
      {config.level === 'High' && '🔴'}
      {config.level} Risk
    </span>
  )
}
