import { NextResponse } from "next/server"
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vencimientoId } = await params
    const body = await req.json()
    const { titulo, periodicidad, jurisdiccion, tipoVencimiento, ocurrencias } = body

    // Preparar datos de update
    const updateData: any = {
      titulo,
      periodicidad,
      jurisdiccion,
      tipoVencimiento,
    }

    // Actualizar ocurrencias si se proporcionan
    if (ocurrencias && Array.isArray(ocurrencias) && ocurrencias.length > 0) {
      // Separar ocurrencias existentes (con ID) de nuevas (sin ID)
      const ocurrenciasExistentes = ocurrencias.filter((o: any) => o.id)
      const ocurrenciasNuevas = ocurrencias.filter((o: any) => !o.id)

      // IDs de ocurrencias que vienen en la request
      const idsEnRequest = ocurrenciasExistentes.map((o: any) => o.id)

      // Traer ocurrencias actuales de la BD
      const ocurrenciasAnteriores = await prisma.vencimientoOcurrencia.findMany({
        where: { vencimientoId }
      })

      // IDs de ocurrencias en la BD que no están en la request = eliminar
      const idsAEliminar = ocurrenciasAnteriores
        .map(o => o.id)
        .filter(id => !idsEnRequest.includes(id))

      // Hacer los cambios en ocurrencias de una sola vez
      if (idsAEliminar.length > 0) {
        await prisma.vencimientoOcurrencia.deleteMany({
          where: { id: { in: idsAEliminar } }
        })
      }

      // Actualizar ocurrencias existentes
      for (const o of ocurrenciasExistentes) {
        await prisma.vencimientoOcurrencia.update({
          where: { id: o.id },
          data: {
            fechaVencimiento: new Date(o.fecha),
            estado: o.estado || "PENDIENTE"
          }
        })
      }

      // Crear nuevas ocurrencias
      if (ocurrenciasNuevas.length > 0) {
        await prisma.vencimientoOcurrencia.createMany({
          data: ocurrenciasNuevas.map((o: any) => ({
            vencimientoId,
            fechaVencimiento: new Date(o.fecha),
            estado: o.estado || "PENDIENTE"
          }))
        })
      }
    } else if (ocurrencias && Array.isArray(ocurrencias) && ocurrencias.length === 0) {
      // Si no hay ocurrencias, eliminar todas
      await prisma.vencimientoOcurrencia.deleteMany({
        where: { vencimientoId }
      })
    }

    // Update principal
    const updated = await prisma.vencimiento.update({
      where: { id: vencimientoId },
      data: updateData,
      include: {
        ocurrencias: {
          orderBy: { fechaVencimiento: "asc" }
        },
      }
    })

    return NextResponse.json(
      { message: "Vencimiento actualizado exitosamente", data: updated },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error actualizando vencimiento:", error)
    return NextResponse.json(
      { error: "Error actualizando vencimiento" },
      { status: 500 }
    )
  }
}
