// Report Detail Page
export default function ReportDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Report Detail</h1>
      <p>Detailed report for {params.id}.</p>
    </div>
  );
}
