import VencimientoItemRow from "./VencimientoItemRow";

interface VencimientosCardProps {
  vencimientos: {
    id: string;
    fechaVencimiento: Date;
    vencimiento: {
      id: string;
      titulo: string;
      tipoVencimiento: string;
      jurisdiccion: string | null;
    };
  }[];
}

export default function VencimientosCard({
  vencimientos,
}: VencimientosCardProps) {
  return (
    <div className="dashboard-card dashboard-card-vencimientos">
      <h2 className="dashboard-card-title">Vencimientos Próximos</h2>

      <div className="dashboard-vencimientos-list">
        {vencimientos.length === 0 ? (
          <div className="dashboard-empty-state">
            <p>No hay vencimientos próximos</p>
          </div>
        ) : (
          vencimientos.map((vencimiento) => (
            <VencimientoItemRow
              key={vencimiento.id}
              id={vencimiento.id}
              fecha={vencimiento.fechaVencimiento}
              titulo={vencimiento.vencimiento.titulo}
              tipoVencimiento={vencimiento.vencimiento.tipoVencimiento}
              jurisdiccion={vencimiento.vencimiento.jurisdiccion}
            />
          ))
        )}
      </div>
    </div>
  );
}
