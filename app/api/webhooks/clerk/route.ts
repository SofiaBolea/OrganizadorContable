import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const evt = (await verifyWebhook(req)) as WebhookEvent;
    const eventType = evt.type;

    console.log(`🚀 Webhook recibido: ${eventType}`);

    // ==========================================================
    // 1. ORGANIZACIÓN CREADA (El contenedor debe existir primero)
    // ==========================================================
    if (eventType === "organization.created") {
      const { id, name } = evt.data;
      await prisma.organizacion.upsert({
        where: { clerkOrganizationId: id },
        update: { nombre: name },
        create: {
          clerkOrganizationId: id,
          nombre: name,
          activa: true,
        },
      });
      return new Response("Organización creada", { status: 200 });
    }

    // ==========================================================
    // 2. MEMBRESÍA CREADA (El motor de creación de usuarios)
    // ==========================================================
    if (eventType === "organizationMembership.created") {
      const { organization, public_user_data, role } = evt.data;
      const { user_id, identifier, first_name, last_name } = public_user_data;
      
      const esAdmin = role === "org:admin";

      return await prisma.$transaction(async (tx) => {
        // A. Buscamos la Org interna
        const org = await tx.organizacion.findUnique({
          where: { clerkOrganizationId: organization.id },
        });

        if (!org) throw new Error(`Org ${organization.id} no encontrada en DB`);

        // B. CREACIÓN/ACTUALIZACIÓN DE LA FILA DE USUARIO PARA ESTA ORG
        const usuario = await tx.usuario.upsert({
          where: {
            clerkId_organizacionId: {
              clerkId: user_id,
              organizacionId: org.id,
            },
          },
          update: {
            nombreCompleto: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
            email: identifier,
            permisoClientes: esAdmin,
            permisoVencimiento: esAdmin,
          },
          create: {
            clerkId: user_id,
            organizacionId: org.id,
            email: identifier,
            nombreCompleto: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
            nombreUsuario: identifier.split("@")[0],
            permisoClientes: esAdmin,
            permisoVencimiento: esAdmin,
          },
        });

        // C. Sincronizar el Rol
        const rolDB = await tx.rol.upsert({
          where: {
            organizacionId_nombreRol: {
              organizacionId: org.id,
              nombreRol: role,
            },
          },
          update: {},
          create: {
            nombreRol: role,
            organizacionId: org.id,
            descripcion: `Rol ${role} autogenerado`,
          },
        });

        // D. Vincular en la tabla intermedia (RBAC)
        await tx.usuarioRol.upsert({
          where: {
            usuarioId_rolId: { usuarioId: usuario.id, rolId: rolDB.id },
          },
          update: { fechaBaja: null },
          create: { usuarioId: usuario.id, rolId: rolDB.id, fechaAlta: new Date() },
        });

        console.log(`✅ [${org.nombre}] Usuario ${usuario.email} sincronizado.`);
        return new Response("OK", { status: 200 });
      });
    }

    // ==========================================================
    // 3. BAJA DE MIEMBRO (Limpieza específica)
    // ==========================================================
    if (eventType === "organizationMembership.deleted") {
      const { organization, public_user_data } = evt.data;

      await prisma.$transaction(async (tx) => {
        const org = await tx.organizacion.findUnique({ 
          where: { clerkOrganizationId: organization.id } 
        });

        if (org) {
          const usuario = await tx.usuario.findUnique({
            where: {
              clerkId_organizacionId: {
                clerkId: public_user_data.user_id,
                organizacionId: org.id,
              },
            },
          });

          if (usuario) {
            await tx.usuarioRol.updateMany({
              where: { usuarioId: usuario.id, rol: { organizacionId: org.id } },
              data: { fechaBaja: new Date() },
            });
            console.log(`🗑️ Usuario ${usuario.email} dado de baja en ${org.nombre}`);
          }
        }
      });
      return new Response("Baja OK", { status: 200 });
    }

    return new Response("Evento ignorado", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook Error:", err.message);
    return new Response("Error", { status: 400 });
  }
}