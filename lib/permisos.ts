import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


// ── CLientes ──────────────────────────────────────────────

export class Permisos {
  static async puedeCrearCliente() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:crear_cliente" });

    // 1. Buscamos primero la organización
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true, nombre: true }
    });
    if (!orgLocal) return false;
    // 2. Buscamos al usuario usando el ID de la organización encontrada
    const usuarioActual = await prisma.usuario.findFirst({
      where: {
        clerkId: userId,
        organizacionId: orgLocal.id // Nos aseguramos que pertenezca a esta org
      },
      select: { id: true, permisoClientes: true }
    });
    return esAdmin || (usuarioActual?.permisoClientes === true && tienePermiso);
  }

  static async puedeEditarCliente() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:modificar_cliente" });
    // 1. Buscamos primero la organización
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true, nombre: true }
    });
    if (!orgLocal) return false;
    // 2. Buscamos al usuario usando el ID de la organización encontrada
    const usuarioActual = await prisma.usuario.findFirst({
      where: {
        clerkId: userId,
        organizacionId: orgLocal.id // Nos aseguramos que pertenezca a esta org
      },
      select: { id: true, permisoClientes: true }
    });
    return esAdmin || (usuarioActual?.permisoClientes === true && tienePermiso);
  }

  static async puedeEliminarCliente() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:eliminar_cliente" });
    // 1. Buscamos primero la organización
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true, nombre: true }
    });
    if (!orgLocal) return false;
    // 2. Buscamos al usuario usando el ID de la organización encontrada
    const usuarioActual = await prisma.usuario.findFirst({
      where: {
        clerkId: userId,
        organizacionId: orgLocal.id // Nos aseguramos que pertenezca a esta org
      },
      select: { id: true, permisoClientes: true }
    });
    return esAdmin || (usuarioActual?.permisoClientes === true && tienePermiso);
  }
 
  static async puedeVerClientes() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:clientes:ver_clientes" });
    return tienePermiso;
  }
  
  static async puedeVerTodosLosClientes() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const esAdmin = has({ role: "org:admin" });
    const tienePermiso = has({ permission: "org:clientes:ver_clientes" });

    // 1. Buscamos primero la organización
    const orgLocal = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
      select: { id: true, nombre: true }
    });
    if (!orgLocal) return false;
    // 2. Buscamos al usuario usando el ID de la organización encontrada
    const usuarioActual = await prisma.usuario.findFirst({
      where: {
        clerkId: userId,
        organizacionId: orgLocal.id // Nos aseguramos que pertenezca a esta org
      },
      select: { id: true, permisoClientes: true }
    });
    return esAdmin || (usuarioActual?.permisoClientes === true && tienePermiso);
  }

  // ── Vencimientos ──────────────────────────────────────────────

  private static async obtenerPermisoVencimientoDB() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return { userId, orgId, has, permisoVencimiento: false, esAdmin: false };

    const esAdmin = has({ role: "org:admin" });

    const organizacion = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
    });

    if (!organizacion) return { userId, orgId, has, permisoVencimiento: false, esAdmin };

    const usuario = await prisma.usuario.findUnique({
      where: { clerkId_organizacionId: { clerkId: userId, organizacionId: organizacion.id } },
      select: { permisoVencimiento: true },
    });

    return { userId, orgId, has, permisoVencimiento: !!usuario?.permisoVencimiento, esAdmin };
  }

  static async puedeVerVencimiento() {
    const { userId, orgId, has, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:ver_vencimientos" });
    return esAdmin || tienePermiso;
  }

  static async puedeCrearVencimiento() {
    const { userId, orgId, has, permisoVencimiento, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:crear_vencimientos" });
    return esAdmin || (permisoVencimiento && tienePermiso);
  }

  static async puedeModificarVencimiento() {
    const { userId, orgId, has, permisoVencimiento, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:modificar_vencimientos" });
    return esAdmin || (permisoVencimiento && tienePermiso);
  }

  static async puedeEliminarVencimiento() {
    const { userId, orgId, has, permisoVencimiento, esAdmin } = await this.obtenerPermisoVencimientoDB();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:vencimientos:eliminar_vencimiento" });
    return esAdmin || (permisoVencimiento && tienePermiso);
  }

  // ── Tareas ──────────────────────────────────────────────

  static async esAdmin() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    return has({ role: "org:admin" });
  }

  static async obtenerContextoUsuario() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return null;

    const esAdmin = has({ role: "org:admin" });

    const organizacion = await prisma.organizacion.findUnique({
      where: { clerkOrganizationId: orgId },
    });
    if (!organizacion) return null;

    const usuario = await prisma.usuario.findUnique({
      where: { clerkId_organizacionId: { clerkId: userId, organizacionId: organizacion.id } },
    });
    if (!usuario) return null;

    return { userId, orgId, esAdmin, organizacion, usuario };
  }

  static async puedeCrearTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    return ctx.esAdmin;
  }

  static async puedeModificarTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    return ctx.esAdmin;
  }

  static async puedeEliminarTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    return ctx.esAdmin;
  }
}
