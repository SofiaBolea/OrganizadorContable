interface VencimientoItemRowProps {
  id: string;
  fecha: Date;
  titulo: string;
  tipoVencimiento: string;
  jurisdiccion?: string | null;
}

function formatFecha(date: Date): string {
  const dia = date.getDate();
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const mes = meses[date.getMonth()];
  const nombreDia = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dia_semana = nombreDia[date.getDay()];

  return `${dia} ${mes}`;
}

export default function VencimientoItemRow({
  id,
  fecha,
  titulo,
  tipoVencimiento,
  jurisdiccion,
}: VencimientoItemRowProps) {
  return (
    <div className="dashboard-vencimiento-item">
      <div className="dashboard-vencimiento-fecha">{formatFecha(fecha)}</div>
      <div className="dashboard-vencimiento-content">
        <p className="dashboard-vencimiento-titulo">{titulo}</p>
        {tipoVencimiento && (
          <span className="dashboard-vencimiento-jurisdiccion">
            {tipoVencimiento}
          </span>
        )}
      </div>
    </div>
  );
}
