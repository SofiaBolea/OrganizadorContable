// app/calendario/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import CalendarioEventos from "../components/CalendarioEventos";
import { redirect } from "next/navigation";
import {
    getTareasAsignadasAdmin,
    getTareasAsignadasAsistente,
    getTareasPropias
} from "@/lib/tareas";
import { expandirTareasADisplayRows, TareaAsignacionRow } from "@/lib/tareas-shared";

export default async function PaginaCalendario() {
    const { userId: clerkId, orgId: clerkOrgId } = await auth();

    if (!clerkId || !clerkOrgId) {
        redirect("/sign-in");
    }

    // 1. Validar organización local
    const orgLocal = await prisma.organizacion.findUnique({
        where: { clerkOrganizationId: clerkOrgId },
        select: { id: true }
    });

    if (!orgLocal) {
        return <div className="p-8 italic text-slate-500">Sincronizando organización...</div>;
    }

    // 2. Obtener perfil y rol del usuario
    const usuario = await prisma.usuario.findUnique({
        where: {
            clerkId_organizacionId: { clerkId, organizacionId: orgLocal.id }
        },
        include: {
            roles: { include: { rol: true } }
        }
    });

    if (!usuario) return <div>Usuario no encontrado</div>;

    const esAdmin = usuario.roles.some(ur => ur.rol.nombreRol.toUpperCase() === 'ADMINISTRADOR');

    // 3. Obtener TareaAsignacionRow[] aplicando filtros por Rol
    const propias = await getTareasPropias(clerkOrgId, clerkId);
    const creadasPorMi = await getTareasAsignadasAdmin(clerkOrgId, clerkId);

    let asignaciones: TareaAsignacionRow[] = [];

    if (esAdmin) {
        // Administrador: Sus tareas propias + las que él creó/asignó
        asignaciones = [...propias, ...creadasPorMi];
    } else {
        // Miembro: Sus tareas propias + las creadas por él + las que tiene asignadas
        const asignadasAMi = await getTareasAsignadasAsistente(clerkOrgId, clerkId);

        // Evitar duplicados (ej: una tarea "ASIGNADA" donde él es creador y asignado)
        const idsExistentes = new Set([...propias, ...creadasPorMi].map(a => a.tareaAsignacionId));
        asignaciones = [...propias, ...creadasPorMi];

        asignadasAMi.forEach(a => {
            if (!idsExistentes.has(a.tareaAsignacionId)) {
                asignaciones.push(a);
            }
        });
    }

    // 4. Lazy Expansion: Generar filas para el calendario (virtuales y reales)
    const tareasExpandidas = expandirTareasADisplayRows(asignaciones);

    // 5. Mapeo a eventos de React Big Calendar
    const eventosTareas = tareasExpandidas.map(t => {
        const fecha = t.fechaOcurrencia ? new Date(t.fechaOcurrencia) : new Date();
        return {
            title: t.titulo,
            start: fecha,
            end: fecha,
            allDay: true,
            resource: {
                type: 'tarea',
                id: t.ocurrenciaId || t.tareaAsignacionId,
                descripcion: t.descripcion,
                prioridad: t.prioridad,
                estado: t.estado,
                color: t.refColorHexa // Color calculado (base o override)
            }
        };
    });

    // 6. Obtener Vencimientos de la Organización
    const vencimientos = await prisma.vencimientoOcurrencia.findMany({
        where: {
            vencimiento: { recurso: { organizacionId: orgLocal.id } }
        },
        include: { vencimiento: true }
    });

    const eventosVencimientos = vencimientos.map(v => ({
        title: v.vencimiento.titulo,
        start: new Date(v.fechaVencimiento),
        end: new Date(v.fechaVencimiento),
        allDay: true,
        resource: {
            type: 'vencimiento',
            id: v.id,
            descripcion: `Jurisdicción: ${v.vencimiento.jurisdiccion || 'N/A'}`,
            prioridad: 'ALTA'
        }
    }));

    return (
        <main className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <CalendarioEventos eventos={[...eventosTareas, ...eventosVencimientos]} />
            </div>
        </main>
    );
}