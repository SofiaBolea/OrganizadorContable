import 'dotenv/config';
import { createClerkClient } from '@clerk/clerk-sdk-node';
// Importamos la clase generada
import prisma from '@/lib/prisma';

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

const clerkRoles = [
  { nombreRol: "org:admin", descripcion: "Administrador de la organización" },
  { nombreRol: "org:member", descripcion: "Miembro estándar de la organización" },
  { nombreRol: "org:viewer", descripcion: "Solo lectura" },
];

async function main() {
  console.log("🚀 Iniciando sincronización Clerk -> Supabase...");

  try {
    const response = await clerkClient.organizations.getOrganizationList();
    const clerkOrgs = response.data;

    if (!clerkOrgs || clerkOrgs.length === 0) {
      console.log("⚠️ No se encontraron organizaciones en Clerk.");
      return;
    }

    for (const clerkOrg of clerkOrgs) {
      console.log(`\n📦 Procesando: ${clerkOrg.name}`);

      // CORRECCIÓN: El modelo se llama 'organizacion' en singular (definido en el schema)
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
          razonSocial: "",
          cuit: "",
          emailContacto: "",
          telefonoContacto: "",
          direccion: "",
          activa: true,
        },
      });

      for (const rol of clerkRoles) {
        await prisma.rol.upsert({
          where: {
            organizacionId_nombreRol: {
              organizacionId: org.id,
              nombreRol: rol.nombreRol,
            },
          },
          update: {},
          create: {
            organizacionId: org.id,
            nombreRol: rol.nombreRol,
            descripcion: rol.descripcion,
          },
        });
      }
      console.log(`✅ Sincronizado: ${clerkOrg.name}`);
    }
    console.log("\n✨ Proceso finalizado.");
  } catch (error) {
    console.error("❌ Error detallado:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Cerramos la conexión correctamente
    await prisma.$disconnect();
  });