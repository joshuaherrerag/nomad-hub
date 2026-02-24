import { useParams } from "react-router-dom";

export default function JobDetailPage() {
  const { id } = useParams();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Detalle del empleo</h1>
      <p className="mt-2 text-muted-foreground">ID: {id}</p>
    </div>
  );
}
