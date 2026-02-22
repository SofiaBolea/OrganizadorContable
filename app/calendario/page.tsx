// app/calendario/page.tsx
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import CalendarioEventos from "../components/CalendarioEventos";
import { redirect } from "next/navigation";

export default async function PaginaCalendario() {
    // 1. Obtener contexto del usuario desde Clerk
    const { userId: clerkId, orgId: clerkOrgId } = await auth();

    if (!clerkId || !clerkOrgId) {
        redirect("/sign-in");
    }

    const orgLocal = await prisma.organizacion.findUnique({
        where: { clerkOrganizationId: clerkOrgId },
        select: { id: true, nombre: true }
    });
    if (!orgLocal) {
        return <div className="p-8 italic text-slate-500">Sincronizando organización...</div>;
    }
    // 2. Obtener el perfil del usuario en nuestra DB con sus roles
    const usuario = await prisma.usuario.findUnique({
        where: {
            clerkId_organizacionId: {
                clerkId,
                organizacionId: orgLocal.id
            }
        },
        include: {
            roles: {
                include: { rol: true }
            }
        }
    });

    if (!usuario) {
        return <div>Error: Perfil de usuario no encontrado.</div>;
    }

    // Determinar si es administrador (asumiendo que el nombre del rol es 'ADMINISTRADOR')
    const esAdmin = usuario.roles.some(ur => ur.rol.nombreRol.toUpperCase() === 'ADMINISTRADOR');

    // 3. Obtener Ocurrencias de Tareas con filtros de rol
    // Filtro base: Tareas de la organización del usuario
    const filterTareas: any = {
        tareaAsignacion: {
            tarea: {
                recurso: { organizacionId: orgLocal.id }
            }
        }
    };

    // Aplicar lógica según el rol solicitado
    if (esAdmin) {
        // Administrador: Tareas donde él es el creador (quien asignó)
        filterTareas.tareaAsignacion.asignadoPorId = usuario.id;
    } else {
        // Miembro: Creadas por él O asignadas a él
        filterTareas.tareaAsignacion.OR = [
            { asignadoPorId: usuario.id },
            { asignadoId: usuario.id }
        ];
    }

    const ocurrencias = await prisma.ocurrencia.findMany({
        where: filterTareas,
        include: {
            tareaAsignacion: {
                include: { tarea: true }
            }
        }
    });

    // 4. Obtener Vencimientos de la Organización
    const vencimientos = await prisma.vencimientoOcurrencia.findMany({
        where: {
            vencimiento: {
                recurso: { organizacionId: orgLocal.id }
            }
        },
        include: {
            vencimiento: true
        }
    });

    // 5. Mapeo a formato de eventos (igual que antes)
    const eventosTareas = ocurrencias.map(ocu => ({
        title: ocu.tituloOverride || ocu.tareaAsignacion.tarea.titulo,
        start: new Date(ocu.fechaOverride || ocu.fechaOriginal),
        end: new Date(ocu.fechaOverride || ocu.fechaOriginal),
        allDay: true,
        resource: {
            type: 'tarea',
            id: ocu.id,
            descripcion: ocu.descripcionOverride || ocu.tareaAsignacion.tarea.descripcion,
            prioridad: ocu.prioridadOverride || ocu.tareaAsignacion.tarea.prioridad
        }
    }));

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
                <header className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900">Agenda Contable</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Vista personalizada para {usuario.nombreCompleto} ({esAdmin ? 'Administrador' : 'Miembro'})
                    </p>
                </header>

                <CalendarioEventos eventos={[...eventosTareas, ...eventosVencimientos]} />
            </div>
        </main>
    );
}