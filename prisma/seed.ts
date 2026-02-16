import 'dotenv/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import prisma from '@/lib/prisma';

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

async function main() {
  console.log("🚀 Iniciando sincronización Clerk (Orgs + Roles + Members) -> Supabase...");

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
      const estaActivaEnClerk = clerkOrg.publicMetadata?.status !== 'disabled';

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
          activa:estaActivaEnClerk
        },
      });

      // 3. Obtener Miembros de la Organización desde Clerk
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({ 
        organizationId: clerkOrg.id 
      });

      console.log(`👥 Sincronizando ${memberships.data.length} miembros...`);

      for (const membership of memberships.data) {
        const clerkUserId = membership.publicUserData?.userId;
        const clerkRoleName = membership.role; // Ej: "org:admin", "org:member"

        if (!clerkUserId) continue;

        // 4. Buscar el Usuario en DB local (debe existir previamente vía Webhook o Sync de Usuarios)
        const usuarioLocal = await prisma.usuario.findUnique({
          where: { clerkId: clerkUserId }
        });

        if (!usuarioLocal) {
          console.warn(`  ⚠️ Usuario ${clerkUserId} no encontrado en DB local. Saltando...`);
          continue;
        }

        // 5. Asegurar que el Rol existe en la DB para esta organización específica
        // Clerk usa roles dinámicos, los creamos en nuestra DB si no existen
        const rolLocal = await prisma.rol.upsert({
          where: {
            organizacionId_nombreRol: {
              organizacionId: org.id,
              nombreRol: clerkRoleName,
            },
          },
          update: {},
          create: {
            organizacionId: org.id,
            nombreRol: clerkRoleName,
            descripcion: `Rol ${clerkRoleName} sincronizado de Clerk`,
          },
        });

        // 6. Crear/Actualizar la relación UsuarioRol (Tabla intermedia)
        await prisma.usuarioRol.upsert({
          where: {
            usuarioId_rolId: {
              usuarioId: usuarioLocal.id,
              rolId: rolLocal.id,
            },
          },
          update: {
            fechaBaja: null, // Si estaba dado de baja, lo reactivamos
          },
          create: {
            usuarioId: usuarioLocal.id,
            rolId: rolLocal.id,
            fechaAlta: new Date(),
          },
        });
      }
      console.log(`✅ Organización ${clerkOrg.name} sincronizada exitosamente.`);
    }

    console.log("\n✨ Proceso de sincronización finalizado con éxito.");
  } catch (error) {
    console.error("❌ Error crítico durante la sincronización:", error);
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