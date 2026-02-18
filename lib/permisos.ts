import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


// ── CLientes ──────────────────────────────────────────────

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

  // ── Vencimientos ──────────────────────────────────────────────

  private static async obtenerPermisoVencimientoDB() {
    const { userId, orgId, has } = await auth();
    console.log("[Permisos] userId:", userId, "orgId:", orgId);
    
    if (!userId || !orgId) return { userId, orgId, has, permisoVencimiento: false, esAdmin: false };

    const esAdmin = has({ role: "org:admin" });
    console.log("[Permisos] esAdmin:", esAdmin);

    const organizacion = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
    });
    console.log("[Permisos] organizacion:", organizacion?.id);

    if (!organizacion) return { userId, orgId, has, permisoVencimiento: false, esAdmin };

    const usuario = await prisma.usuario.findUnique({
      where: { clerkId_organizacionId: { clerkId: userId, organizacionId: organizacion.id } },
      select: { permisoVencimiento: true },
    });
    console.log("[Permisos] usuario permisoVencimiento:", usuario?.permisoVencimiento);

    return { userId, orgId, has, permisoVencimiento: !!usuario?.permisoVencimiento, esAdmin };
  }

  static async puedeVerVencimiento() {
    const { userId, orgId, has, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:ver_vencimientos" });
    console.log("[Permisos] puedeVerVencimiento - esAdmin:", esAdmin, "tienePermiso:", tienePermiso);
    return esAdmin || tienePermiso;
  }

  static async puedeCrearVencimiento() {
    const { userId, orgId, has, permisoVencimiento, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:crear_vencimientos" });
    console.log("[Permisos] puedeCrearVencimiento - esAdmin:", esAdmin, "permisoVencimiento:", permisoVencimiento, "tienePermiso:", tienePermiso);
    return esAdmin || (permisoVencimiento && tienePermiso);
  }

  static async puedeModificarVencimiento() {
    const { userId, orgId, has, permisoVencimiento, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:modificar_vencimientos" });
    console.log("[Permisos] puedeModificarVencimiento - esAdmin:", esAdmin, "permisoVencimiento:", permisoVencimiento, "tienePermiso:", tienePermiso);
    return esAdmin || (permisoVencimiento && tienePermiso);
  }

  static async puedeEliminarVencimiento() {
    const { userId, orgId, has, permisoVencimiento, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:eliminar_vencimiento" });
    console.log("[Permisos] puedeEliminarVencimiento - esAdmin:", esAdmin, "permisoVencimiento:", permisoVencimiento, "tienePermiso:", tienePermiso);
    return esAdmin || (permisoVencimiento && tienePermiso);
  }
}
