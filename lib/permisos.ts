import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
}
