import ApplicationDetailPage from '@/app/dashboard/application/[id]/page'

export default function ApprovalTypeApplicationPage({
  params,
}: {
  params: Promise<{ approvalTypeId: string }>
}) {
  // Pass the approvalTypeId parameter mapped directly to the application detail page component
  const mappedParams = params.then((p) => ({ id: p.approvalTypeId }))
  return <ApplicationDetailPage params={mappedParams} />
}
