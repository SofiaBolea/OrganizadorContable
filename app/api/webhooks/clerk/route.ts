import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  console.log("🔔 Webhook received!");
  try {
    const evt = (await verifyWebhook(req)) as WebhookEvent;
    const eventType = evt.type;

    console.log(`🚀 Procesando: ${eventType}`);

    // --- 1. ORGANIZACIÓN ---
    if (eventType === "organization.created") {
      const { id, name } = evt.data;
      await prisma.organizacion.upsert({
        where: { clerkOrganizationId: id },
        update: { nombre: name },
        create: { clerkOrganizationId: id, nombre: name, activa: true },
      });
      return new Response("Org Sincronizada", { status: 200 });
    }

    // --- 2. MEMBRESÍA (EL PUNTO DE FALLO) ---
    if (eventType === "organizationMembership.created") {
      const { organization, public_user_data, role } = evt.data;
      const { user_id, identifier, first_name, last_name } = public_user_data;
      const esAdmin = role.includes("admin");

      return await prisma.$transaction(async (tx) => {
        // BUSQUEDA CRÍTICA
        const org = await tx.organizacion.findUnique({
          where: { clerkOrganizationId: organization.id },
        });

        if (!org) {
          console.error(`❌ ERROR: La Org ${organization.id} no existe en DB. ¿Corriste el seed?`);
          return new Response("Organización no encontrada", { status: 400 });
        }

        console.log(`🔗 Vinculando usuario ${identifier} a la Org interna: ${org.id}`);

        const usuario = await tx.usuario.upsert({
          where: {
            clerkId_organizacionId: {
              clerkId: user_id,
              organizacionId: org.id,
            },
          },
          update: {
            nombreCompleto: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
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

        // Sincronización de Rol
        const rolDB = await tx.rol.upsert({
          where: { organizacionId_nombreRol: { organizacionId: org.id, nombreRol: role } },
          update: {},
          create: { nombreRol: role, organizacionId: org.id },
        });

        await tx.usuarioRol.upsert({
          where: { usuarioId_rolId: { usuarioId: usuario.id, rolId: rolDB.id } },
          update: { fechaBaja: null },
          create: { usuarioId: usuario.id, rolId: rolDB.id, fechaAlta: new Date() },
        });

        console.log(`✅ ÉXITO: Usuario ${usuario.email} guardado con ID ${usuario.id}`);
        return new Response("OK", { status: 200 });
      });
    }

    return new Response("Evento recibido", { status: 200 });
  } catch (err: any) {
    console.error("🔥 WEBHOOK CRITICAL ERROR:", err.message);
    return new Response(`Error: ${err.message}`, { status: 400 });
  }
}