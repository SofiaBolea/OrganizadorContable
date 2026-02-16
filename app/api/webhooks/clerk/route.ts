import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!WEBHOOK_SECRET) throw new Error('Falta el CLERK_WEBHOOK_SECRET')

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Faltan headers de Svix', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Error de verificación', { status: 400 })
  }

  const eventType = evt.type;

  // ==========================================================
  // 1. ORGANIZACIÓN CREADA
  // ==========================================================
  if (eventType === "organization.created") {
    const { id, name } = evt.data;
    await prisma.organizacion.upsert({
      where: { clerkOrganizationId: id },
      update: { nombre: name },
      create: { clerkOrganizationId: id, nombre: name, activa: true },
    });
    console.log(`🏢 Organización creada: ${name}`);
    return new Response('Org Creada', { status: 200 });
  }

  // ==========================================================
  // 2. MEMBRESÍA CREADA (Aquí es donde se crea al ADMIN o al ASISTENTE)
  // ==========================================================
  if (eventType === "organizationMembership.created") {
    const { organization, public_user_data, role } = evt.data;
    const { user_id, identifier, first_name, last_name } = public_user_data;

    // Lógica de permisos: Si el rol es admin, activamos todo por defecto
    const esAdmin = role === "org:admin" || role === "admin";

    return await prisma.$transaction(async (tx) => {
      // A. Buscamos la Org (ya debe existir por el evento anterior)
      const org = await tx.organizacion.findUnique({
        where: { clerkOrganizationId: organization.id },
      });

      if (!org) throw new Error("Organización no encontrada");

      // B. CREAMOS AL USUARIO (Si es el fundador, se crea aquí con sus permisos)
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
          permisoClientes: esAdmin, // Admin = true por defecto
          permisoVencimiento: esAdmin, // Admin = true por defecto
        },
      });

      // C. Sincronizar Rol
      const rolDB = await tx.rol.upsert({
        where: { organizacionId_nombreRol: { organizacionId: org.id, nombreRol: role } },
        update: {},
        create: { nombreRol: role, organizacionId: org.id },
      });

      // D. Vincular en tabla intermedia
      await tx.usuarioRol.upsert({
        where: { usuarioId_rolId: { usuarioId: usuario.id, rolId: rolDB.id } },
        update: { fechaBaja: null },
        create: { usuarioId: usuario.id, rolId: rolDB.id, fechaAlta: new Date() },
      });

      console.log(`✅ ${esAdmin ? 'ADMIN' : 'ASISTENTE'} sincronizado: ${usuario.email} en ${org.nombre}`);
      return new Response('Membresía procesada', { status: 200 });
    });
  }

  // ==========================================================
  // 3. MEMBRESÍA ELIMINADA (Baja)
  // ==========================================================
  if (eventType === "organizationMembership.deleted") {
    const { organization, public_user_data } = evt.data;

    await prisma.$transaction(async (tx) => {
      const org = await tx.organizacion.findUnique({ where: { clerkOrganizationId: organization.id } });
      if (!org) return;

      const usuario = await tx.usuario.findUnique({
        where: { clerkId_organizacionId: { clerkId: public_user_data.user_id, organizacionId: org.id } }
      });

      if (usuario) {
        await tx.usuarioRol.updateMany({
          where: { usuarioId: usuario.id, fechaBaja: null },
          data: { fechaBaja: new Date() },
        });
        console.log(`🗑️ Baja registrada para ${usuario.email}`);
      }
    });
    return new Response('Baja procesada', { status: 200 });
  }
  // --- DENTRO DEL POST ---
  if (eventType === "user.updated") {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const email = email_addresses[0].email_address;
    const nombre = `${first_name ?? ""} ${last_name ?? ""}`.trim();

    await prisma.usuario.updateMany({
      where: { clerkId: id },
      data: {
        nombreCompleto: nombre,
        email: email,
      },
    });
    console.log(`👤 Datos de usuario actualizados: ${nombre}`);
    return new Response('Usuario actualizado', { status: 200 });
  }
  if (eventType === "organization.updated") {
    const { id, name } = evt.data;

    await prisma.organizacion.update({
      where: { clerkOrganizationId: id },
      data: { nombre: name },
    });
    console.log(`🏢 Organización actualizada: ${name}`);
    return new Response('Org actualizada', { status: 200 });
  }

  if (eventType === "organizationMembership.updated") {
    const { organization, public_user_data, role } = evt.data;
    const esAdmin = role === "org:admin" || role === "admin";

    await prisma.usuario.update({
      where: {
        clerkId_organizacionId: {
          clerkId: public_user_data.user_id,
          organizacionId: (await prisma.organizacion.findUnique({
            where: { clerkOrganizationId: organization.id }
          }))?.id || ""
        }
      },
      data: {
        permisoClientes: esAdmin,
        permisoVencimiento: esAdmin
      }
    });
    return new Response('Rol actualizado', { status: 200 });
  }

  return new Response('Evento recibido', { status: 200 });
}
