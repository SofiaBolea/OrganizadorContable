import 'dotenv/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import prisma from '@/lib/prisma';

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

async function main() {
  console.log("🚀 Iniciando sincronización Clerk (Orgs + Users + Roles) -> Supabase...");

  try {
    // 1. Obtener todas las organizaciones de Clerk
    const response = await clerkClient.organizations.getOrganizationList();
    const clerkOrgs = response.data;

    if (!clerkOrgs || clerkOrgs.length === 0) {
      console.log("⚠️ No se encontraron organizaciones en Clerk.");
      return;
    }

    for (const clerkOrg of clerkOrgs) {
      console.log(`\n🏢 Procesando Organización: ${clerkOrg.name} (${clerkOrg.id})`);
      
      // 2. Upsert de la Organización
      const org = await prisma.organizacion.upsert({
        where: { clerkOrganizationId: clerkOrg.id },
        update: {
          nombre: clerkOrg.name,
          logoUrl: clerkOrg.imageUrl,
        },
        create: {
          clerkOrganizationId: clerkOrg.id,
          nombre: clerkOrg.name,
          logoUrl: clerkOrg.imageUrl,
          activa: true,
        },
      });

      // 3. Obtener Miembros de la Organización
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({ 
        organizationId: clerkOrg.id 
      });

      console.log(`👥 Sincronizando ${memberships.data.length} miembros para ${org.nombre}...`);

      for (const membership of memberships.data) {
        const userData = membership.publicUserData;
        const clerkUserId = userData?.userId;
        const clerkRole = membership.role; // "org:admin" o "org:member"

        if (!clerkUserId || !userData) continue;

        const email = userData.identifier;
        const nombreCompleto = `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim();
        const esAdmin = clerkRole === "org:admin";

        // 4. Upsert del Usuario usando la LLAVE COMPUESTA
        // Como reseteaste las tablas, aquí se CREARÁN los registros.
        const usuarioLocal = await prisma.usuario.upsert({
          where: {
            clerkId_organizacionId: {
              clerkId: clerkUserId,
              organizacionId: org.id,
            },
          },
          update: {
            email: email,
            nombreCompleto: nombreCompleto || email,
            permisoClientes: esAdmin,
            permisoVencimiento: esAdmin,
          },
          create: {
            clerkId: clerkUserId,
            organizacionId: org.id,
            email: email,
            nombreCompleto: nombreCompleto || email,
            nombreUsuario: email.split('@')[0],
            permisoClientes: esAdmin,
            permisoVencimiento: esAdmin,
          },
        });

        // 5. Asegurar que el Rol existe para esta Org
        const rolLocal = await prisma.rol.upsert({
          where: {
            organizacionId_nombreRol: {
              organizacionId: org.id,
              nombreRol: clerkRole,
            },
          },
          update: {},
          create: {
            organizacionId: org.id,
            nombreRol: clerkRole,
            descripcion: `Rol ${clerkRole} sincronizado de Clerk`,
          },
        });

        // 6. Vincular Usuario con el Rol
        await prisma.usuarioRol.upsert({
          where: {
            usuarioId_rolId: {
              usuarioId: usuarioLocal.id,
              rolId: rolLocal.id,
            },
          },
          update: { fechaBaja: null },
          create: {
            usuarioId: usuarioLocal.id,
            rolId: rolLocal.id,
            fechaAlta: new Date(),
          },
        });
      }
      console.log(`✅ Sincronización completa para: ${clerkOrg.name}`);
    }

    console.log("\n✨ Base de datos poblada exitosamente.");
  } catch (error) {
    console.error("❌ Error crítico durante el seeding:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });