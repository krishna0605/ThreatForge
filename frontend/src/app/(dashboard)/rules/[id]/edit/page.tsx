// YARA Rule Editor Page
export default function RuleEditorPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Rule Editor</h1>
      <p>Editing rule {params.id}.</p>
    </div>
  );
}
