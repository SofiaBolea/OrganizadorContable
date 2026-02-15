import 'dotenv/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import prisma from '@/lib/prisma';

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

async function main() {
  console.log("🚀 Iniciando sincronización Clerk (Orgs + Roles + Members) -> Supabase...");

  try {
    const response = await clerkClient.organizations.getOrganizationList();
    const clerkOrgs = response.data;

    if (!clerkOrgs || clerkOrgs.length === 0) {
      console.log("⚠️ No se encontraron organizaciones en Clerk.");
      return;
    }

    for (const clerkOrg of clerkOrgs) {
      console.log(`\n🏢 Procesando Organización: ${clerkOrg.name} (${clerkOrg.id})`);
      const estaActivaEnClerk = clerkOrg.publicMetadata?.status !== 'disabled';

      // 1. Upsert de la Organización
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
          activa: estaActivaEnClerk
        },
      });

      // ==========================================================
      // NUEVO PASO: SINCRONIZAR DEFINICIONES DE ROLES
      // ==========================================================
      // Nota: Clerk no tiene un endpoint "listRolesByOrg", ya que los roles 
      // son a nivel de instancia, pero podemos obtener los roles permitidos.
      // Si usas roles personalizados, lo ideal es tener un array de referencia 
      // o extraerlos de la respuesta de membresías.
      
      // Obtenemos los roles que existen actualmente en los miembros para asegurar consistencia
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({ 
        organizationId: clerkOrg.id 
      });

      // Extraemos roles únicos presentes en Clerk para esta org
      const rolesEnClerk = [...new Set(memberships.data.map(m => m.role))];

      console.log(`🛠️  Sincronizando ${rolesEnClerk.length} definiciones de roles...`);

      for (const roleName of rolesEnClerk) {
        await prisma.rol.upsert({
          where: {
            organizacionId_nombreRol: {
              organizacionId: org.id,
              nombreRol: roleName,
            },
          },
          update: {}, // No sobreescribimos si ya existe
          create: {
            organizacionId: org.id,
            nombreRol: roleName,
            descripcion: `Rol ${roleName} detectado desde Clerk`,
          },
        });
      }
      // ==========================================================

      console.log(`👥 Sincronizando ${memberships.data.length} miembros...`);

      for (const membership of memberships.data) {
        const clerkUserId = membership.publicUserData?.userId;
        const clerkRoleName = membership.role;

        if (!clerkUserId) continue;

        const usuarioLocal = await prisma.usuario.findUnique({
          where: { clerkId: clerkUserId }
        });

        if (!usuarioLocal) {
          console.warn(`  ⚠️ Usuario ${clerkUserId} no encontrado en DB local. Saltando...`);
          continue;
        }

        // Buscamos el ID del rol que acabamos de asegurar arriba
        const rolLocal = await prisma.rol.findUnique({
          where: {
            organizacionId_nombreRol: {
              organizacionId: org.id,
              nombreRol: clerkRoleName,
            },
          },
        });

        if (rolLocal) {
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
      }
      console.log(`✅ Organización ${clerkOrg.name} sincronizada exitosamente.`);
    }

    console.log("\n✨ Proceso de sincronización finalizado con éxito.");
  } catch (error) {
    console.error("❌ Error crítico durante la sincronización:", error);
    process.exit(1);
  }
}

main().finally(async () => await prisma.$disconnect());