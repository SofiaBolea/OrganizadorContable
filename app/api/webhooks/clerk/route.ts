import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const evt = (await verifyWebhook(req)) as WebhookEvent;
    const eventType = evt.type;

    console.log(`🚀 Webhook procesando: ${eventType}`);

    // ==========================================================
    // 1. EL ADMIN CREA SU CUENTA (Único momento de creación de Org)
    // ==========================================================
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, username } = evt.data;
      const email = email_addresses[0]?.email_address;
      const nombreCompleto = `${first_name ?? ""} ${last_name ?? ""}`.trim();

      await prisma.$transaction(async (tx) => {
        // CREACIÓN DE ORGANIZACIÓN (Solo aquí se permite)
        const org = await tx.organizacion.create({
          data: {
            nombre: `Estudio de ${nombreCompleto || email}`,
            clerkOrganizationId: `OWNER_${id}`, // Usamos un ID rastreable inicialmente
            activa: true,
          },
        });

        const usuario = await tx.usuario.create({
          data: {
            clerkId: id,
            email: email,
            nombreCompleto: nombreCompleto,
            nombreUsuario: username ?? email.split("@")[0],
            organizacionId: org.id,
            permisoClientes: true,     // Admin = true
            permisoVencimiento: true,  // Admin = true
          },
        });

        // Crear el rol administrativo para esta organización
        const rol = await tx.rol.create({
          data: {
            nombreRol: "org:admin",
            organizacionId: org.id,
          },
        });

        await tx.usuarioRol.create({
          data: {
            usuarioId: usuario.id,
            rolId: rol.id,
            fechaAlta: new Date(),
          },
        });
      });
      return new Response("Admin y Org creados", { status: 200 });
    }

    // ==========================================================
    // 2. ASISTENTE SE UNE (Vinculación estricta a Org existente)
    // ==========================================================
    if (eventType === "organizationMembership.created") {
      const { organization, public_user_data, role } = evt.data;
      const { user_id, identifier, first_name, last_name } = public_user_data;

      await prisma.$transaction(async (tx) => {
        // A. BUSCAR ORGANIZACIÓN (Intentar por ID real de Clerk)
        let org = await tx.organizacion.findUnique({
          where: { clerkOrganizationId: organization.id },
        });

        // B. SI NO EXISTE: Buscamos si el Admin la creó (usando created_by de tu JSON)
        if (!org) {
          const ownerId = (organization as any).created_by;
          org = await tx.organizacion.findUnique({
            where: { clerkOrganizationId: `OWNER_${ownerId}` },
          });

          if (org) {
            // "CURACIÓN": Actualizamos el ID temporal al ID real org_... que envió Clerk
            org = await tx.organizacion.update({
              where: { id: org.id },
              data: { clerkOrganizationId: organization.id }
            });
            console.log("✅ ID de Organización sincronizado con Clerk");
          }
        }

        if (!org) throw new Error("La organización no existe en la DB");

        // C. CREAR O ACTUALIZAR USUARIO (Asistente)
        const usuario = await tx.usuario.upsert({
          where: { clerkId: user_id },
          update: { 
            organizacionId: org.id,
            permisoClientes: false, 
            permisoVencimiento: false 
          },
          create: {
            clerkId: user_id,
            email: identifier,
            nombreCompleto: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
            nombreUsuario: identifier.split("@")[0],
            organizacionId: org.id,
            permisoClientes: false,
            permisoVencimiento: false,
          },
        });

        // D. BUSCAR O CREAR ROL
        let rol = await tx.rol.findFirst({
          where: { nombreRol: role, organizacionId: org.id },
        });

        if (!rol) {
          rol = await tx.rol.create({
            data: { nombreRol: role, organizacionId: org.id },
          });
        }

        // E. VINCULAR EN USUARIOROL (Usando ID compuesto de tu schema)
        await tx.usuarioRol.upsert({
          where: {
            usuarioId_rolId: { usuarioId: usuario.id, rolId: rol.id },
          },
          update: { fechaBaja: null },
          create: { usuarioId: usuario.id, rolId: rol.id, fechaAlta: new Date() },
        });
      });
      return new Response("Miembro vinculado", { status: 200 });
    }

    // ==========================================================
    // 3. BAJA DE MIEMBRO (Actualiza fechaBaja)
    // ==========================================================
    if (eventType === "organizationMembership.deleted") {
      const { organization, public_user_data } = evt.data;

      await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.findUnique({ where: { clerkId: public_user_data.user_id } });
        const org = await tx.organizacion.findUnique({ where: { clerkOrganizationId: organization.id } });

        if (usuario && org) {
          await tx.usuarioRol.updateMany({
            where: {
              usuarioId: usuario.id,
              rol: { organizacionId: org.id },
              fechaBaja: null,
            },
            data: { fechaBaja: new Date() },
          });
          console.log(`🗑️ Fecha de baja aplicada a ${public_user_data.identifier}`);
        }
      });
      return new Response("Baja procesada", { status: 200 });
    }

    return new Response("Evento no manejado", { status: 200 });
  } catch (err) {
    console.error("❌ Error Crítico:", err);
    return new Response("Error", { status: 400 });
  }
}