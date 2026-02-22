
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

  static async asistentes() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:asistentes:ver_asistentes" });
    return tienePermiso;
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

    return { userId, orgId, has, esAdmin, organizacion, usuario };
  }

  static async puedeCrearTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    const tienePermiso = ctx.has({ permission: "org:tareas:crear_tarea" });
    return ctx.esAdmin || tienePermiso;
  }

  static async puedeVerTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    const tienePermiso = ctx.has({ permission: "org:tareas:ver_tareas" });
    return ctx.esAdmin || tienePermiso;
  }

  static async puedeModificarTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    const tienePermiso = ctx.has({ permission: "org:tareas:modificar_tarea" });
    return ctx.esAdmin || tienePermiso;
  }

  static async puedeEliminarTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    const tienePermiso = ctx.has({ permission: "org:tareas:eliminar_tarea" });
    return ctx.esAdmin || tienePermiso;
  }

  static async puedeCambiarEstadoTareaAsignada() {
    const ctx = await this.obtenerContextoUsuario();
    if (!ctx) return false;
    const tienePermiso = ctx.has({ permission: "org:tareas:cambiar_estado" });
    return ctx.esAdmin || tienePermiso;
  }


  // ── Asistentes ──────────────────────────────────────────────

  static async puedeVerAsistentes() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:asistentes:ver_asistentes" });
    return tienePermiso;
  }

  static async puedeEditarAsistentes() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:asistentes:modificar_asistente" });
    return tienePermiso;
  }

  static async puedeInvitarAsistentes() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:asistentes:crear_asistente" });
    return tienePermiso;
  }

  static async puedeVerRecursosReferencia() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:recursos_de_referencia:ver_recurso_ref" });
    return tienePermiso;
  }

  static async puedeCrearRecursosReferencia() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:recursos_de_referencia:crear_recurso_ref" });
    return tienePermiso;
  }

  static async puedeModificarRecursosReferencia() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:recursos_de_referencia:modificar_recurso_ref" });
    return tienePermiso;
  }

  static async puedeEliminarRecursosReferencia() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:recursos_de_referencia:eliminar_recurso_ref" });
    return tienePermiso;
  }

  static async puedeCrearRecursosRefGlobales() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:recursos_de_referencia_globales:crear" });
    return tienePermiso;
  }

  static async puedeModificarRecursosRefGlobales() {
    const { userId, orgId, has } = await auth();
    if (!userId || !orgId) return false;
    const tienePermiso = has({ permission: "org:recursos_de_referencia_globales:modificar" });
    return tienePermiso;
  }

}
