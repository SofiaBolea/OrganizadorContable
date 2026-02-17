import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export class Permisos {
  static async puedeCrearCliente() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:crear_cliente" });
    const usuarioDB = await prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: { not: "" } },
      select: { permisoClientes: true }
    });
    return esAdmin || (usuarioDB?.permisoClientes === true && tienePermiso);
  }

  static async puedeEditarCliente() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:modificar_cliente" });
    const usuarioDB = await prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: { not: "" } },
      select: { permisoClientes: true }
    });
    return esAdmin || (usuarioDB?.permisoClientes === true && tienePermiso);
  }

  static async puedeEliminarCliente() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:eliminar_cliente" });
    const usuarioDB = await prisma.usuario.findFirst({
      where: { clerkId: userId, organizacionId: { not: "" } },
      select: { permisoClientes: true }
    });
    return esAdmin || (usuarioDB?.permisoClientes === true && tienePermiso);
  }
}
