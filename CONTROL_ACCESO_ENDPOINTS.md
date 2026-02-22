# Control de Acceso - Endpoints de Tareas

Este documento detalla todas las validaciones de permisos implementadas en los endpoints de tareas usando el sistema de Clerk.

## Resumen de Permisos Disponibles

Todos los permisos están definidos en `lib/permisos.ts`:

| Permiso | Descripción |
|---------|-------------|
| `puedeCrearTareaAsignada()` | Crear tareas asignadas a otros usuarios |
| `puedeCrearTarea()` | Crear tareas en general |
| `puedeVerTareaAsignada()` | Ver tareas asignadas |
| `puedeVerTarea()` | Ver tareas propias |
| `puedeModificarTareaAsignada()` | Modificar tareas asignadas |
| `puedeModificarTarea()` | Modificar tareas propias |
| `puedeEliminarTareaAsignada()` | Eliminar tareas asignadas |
| `puedeEliminarTarea()` | Eliminar tareas propias |
| `puedeCambiarEstadoTareaAsignada()` | Cambiar estado de tareas asignadas |
| `asistentes()` | Ver lista de asistentes |
| `esAdmin()` | Verificar si es administrador |

## Endpoints Protegidos

### 1. POST /api/tareas - Crear Tarea
**Funcionalidad:** Crear una nueva tarea (ASIGNADA o PROPIA)

**Validaciones:**
- ✅ `puedeCrearTarea()` - Creación general
- ✅ `puedeCrearTareaAsignada()` - Solo si es tipo ASIGNADA
- ✅ Requiere `orgId` y `userId`

**Código:**
```typescript
const puedeCrearTarea = await Permisos.puedeCrearTarea();
if (!puedeCrearTarea) {
  return NextResponse.json({ error: "No tienes permisos para crear tareas" }, { status: 403 });
}

if (tipoTarea === "ASIGNADA") {
  const puedeCrearAsignada = await Permisos.puedeCrearTareaAsignada();
  if (!puedeCrearAsignada) {
    return NextResponse.json({ error: "No tienes permisos para crear tareas asignadas" }, { status: 403 });
  }
}
```

---

### 2. GET /api/tareas - Obtener Tareas
**Funcionalidad:** Obtener lista de tareas (asignadas o propias)

**Validaciones:**
- ✅ `puedeVerTarea()` - Permiso general
- ✅ `puedeVerTareaAsignada()` - Solo si solicita tareas "asignadas"
- ✅ Requiere `orgId` y `userId`

**Código:**
```typescript
const puedeVerTarea = await Permisos.puedeVerTarea();
if (!puedeVerTarea) {
  return NextResponse.json({ error: "No tienes permisos para ver tareas" }, { status: 403 });
}

if (tipo === "asignadas") {
  const puedeVer = await Permisos.puedeVerTareaAsignada();
  if (!puedeVer) {
    return NextResponse.json({ error: "No tienes permisos para ver tareas asignadas" }, { status: 403 });
  }
}
```

---

### 3. GET /api/tareas/[id] - Detalle de Tarea
**Funcionalidad:** Obtener detalle de una tarea específica

**Validaciones:**
- ✅ `puedeVerTareaAsignada()` - Si es tarea ASIGNADA
- ✅ `puedeVerTarea()` - Si es tarea PROPIA
- ✅ Requiere `orgId`

**Código:**
```typescript
if (tarea.tipoTarea === "ASIGNADA") {
  const puedeVer = await Permisos.puedeVerTareaAsignada();
  if (!puedeVer) {
    return NextResponse.json({ error: "No tienes permisos para ver tareas asignadas" }, { status: 403 });
  }
} else {
  const puedeVer = await Permisos.puedeVerTarea();
  if (!puedeVer) {
    return NextResponse.json({ error: "No tienes permisos para ver tareas" }, { status: 403 });
  }
}
```

---

### 4. PUT /api/tareas/[id] - Actualizar Tarea
**Funcionalidad:** Actualizar una tarea completa

**Validaciones:**
- ✅ `puedeModificarTareaAsignada()` - Si es tarea ASIGNADA
- ✅ `puedeModificarTarea()` - Si es tarea PROPIA
- ✅ Requiere `orgId` y `userId`

**Código:**
```typescript
if (tarea.tipoTarea === "ASIGNADA") {
  const puedeModificar = await Permisos.puedeModificarTareaAsignada();
  if (!puedeModificar) {
    return NextResponse.json({ error: "No tienes permisos para modificar tareas asignadas" }, { status: 403 });
  }
} else {
  const puedeModificar = await Permisos.puedeModificarTarea();
  if (!puedeModificar) {
    return NextResponse.json({ error: "No tienes permisos para modificar tareas" }, { status: 403 });
  }
}
```

---

### 5. DELETE /api/tareas/[id] - Eliminar Tarea
**Funcionalidad:** Eliminar una tarea completa

**Validaciones:**
- ✅ `puedeEliminarTareaAsignada()` - Si es tarea ASIGNADA
- ✅ `puedeEliminarTarea()` - Si es tarea PROPIA
- ✅ Requiere `orgId`

**Código:**
```typescript
if (tarea.tipoTarea === "ASIGNADA") {
  const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
  if (!puedeEliminar) {
    return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
  }
} else {
  const puedeEliminar = await Permisos.puedeEliminarTarea();
  if (!puedeEliminar) {
    return NextResponse.json({ error: "No tienes permisos para eliminar tareas" }, { status: 403 });
  }
}
```

---

### 6. POST /api/tareas/ocurrencias - Materializar Ocurrencia
**Funcionalidad:** Crear o actualizar una ocurrencia específica de una tarea

**Validaciones:**
- ✅ `puedeCambiarEstadoTareaAsignada()` - Cambiar estado/estado de ocurrencia
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeModificar = await Permisos.puedeCambiarEstadoTareaAsignada();
if (!puedeModificar) {
  return NextResponse.json({ error: "No tienes permisos para cambiar el estado de tareas asignadas" }, { status: 403 });
}
```

---

### 7. PATCH /api/tareas/ocurrencias - Cancelar Desde Fecha
**Funcionalidad:** Cancelar todas las ocurrencias desde una fecha en adelante

**Validaciones:**
- ✅ `puedeEliminarTareaAsignada()` - Eliminar ocurrencias
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
if (!puedeEliminar) {
  return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
}
```

---

### 8. GET /api/tareas/ocurrencias - Obtener Ocurrencia
**Funcionalidad:** Obtener datos de una ocurrencia específica con overrides

**Validaciones:** ✅ (NUEVA)
- ✅ `puedeVerTareaAsignada()` - Ver ocurrencias
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeVer = await Permisos.puedeVerTareaAsignada();
if (!puedeVer) {
  return NextResponse.json({ error: "No tienes permisos para ver tareas asignadas" }, { status: 403 });
}
```

---

### 9. PUT /api/tareas/asignaciones/[id] - Actualizar Asignación
**Funcionalidad:** Actualizar estado o color de una asignación

**Validaciones:** ✅ (NUEVA)
- ✅ `puedeModificarTareaAsignada()` - Modificar asignación
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeModificar = await Permisos.puedeModificarTareaAsignada();
if (!puedeModificar) {
  return NextResponse.json({ error: "No tienes permisos para modificar tareas asignadas" }, { status: 403 });
}
```

---

### 10. DELETE /api/tareas/asignaciones/[id] - Eliminar Asignación
**Funcionalidad:** Eliminar una asignación específica

**Validaciones:** ✅ (NUEVA)
- ✅ `puedeEliminarTareaAsignada()` - Eliminar asignación
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
if (!puedeEliminar) {
  return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
}
```

---

### 11. GET /api/tareas/asistentes - Listar Asistentes
**Funcionalidad:** Obtener lista de asistentes de la organización

**Validaciones:** ✅ (NUEVA)
- ✅ `asistentes()` - Ver asistentes
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeVer = await Permisos.asistentes();
if (!puedeVer) {
  return NextResponse.json({ error: "No tienes permisos para ver asistentes" }, { status: 403 });
}
```

---

### 12. DELETE /api/tareas/ocurrencias/[id] - Cancelar Ocurrencia
**Funcionalidad:** Cancelar una ocurrencia materializada (marcar como CANCELADA)

**Validaciones:** ✅ (NUEVA)
- ✅ `puedeEliminarTareaAsignada()` - Eliminar ocurrencia
- ✅ Requiere `orgId`

**Código:**
```typescript
const puedeEliminar = await Permisos.puedeEliminarTareaAsignada();
if (!puedeEliminar) {
  return NextResponse.json({ error: "No tienes permisos para eliminar tareas asignadas" }, { status: 403 });
}
```

---

## Matriz de Control de Acceso

| Endpoint | Método | Sin Permisos | Con Permisos |
|----------|--------|--------------|--------------|
| /api/tareas | POST | 403 Forbidden | 201 Created |
| /api/tareas | GET | 403 Forbidden | 200 OK |
| /api/tareas/[id] | GET | 403 Forbidden | 200 OK |
| /api/tareas/[id] | PUT | 403 Forbidden | 200 OK |
| /api/tareas/[id] | DELETE | 403 Forbidden | 200 OK |
| /api/tareas/ocurrencias | POST | 403 Forbidden | 201 Created |
| /api/tareas/ocurrencias | PATCH | 403 Forbidden | 200 OK |
| /api/tareas/ocurrencias | GET | 403 Forbidden | 200 OK |
| /api/tareas/asignaciones/[id] | PUT | 403 Forbidden | 200 OK |
| /api/tareas/asignaciones/[id] | DELETE | 403 Forbidden | 200 OK |
| /api/tareas/asistentes | GET | 403 Forbidden | 200 OK |
| /api/tareas/ocurrencias/[id] | DELETE | 403 Forbidden | 200 OK |

---

## Cambios Realizados

### ✅ Endpoints Mejorados (6 endpoints)

1. **GET /api/tareas/ocurrencias** - Agregada validación de permisos
2. **PUT /api/tareas/asignaciones/[id]** - Agregada validación de permisos
3. **DELETE /api/tareas/asignaciones/[id]** - Agregada validación de permisos
4. **GET /api/tareas/asistentes** - Agregada validación de permisos
5. **DELETE /api/tareas/ocurrencias/[id]** - Agregada validación de permisos
6. **GET/PUT/DELETE /api/tareas/[id]** - Mejoradas validaciones (ahora distinguen entre ASIGNADA y PROPIA)

### ✅ Endpoints Ya Protegidos (6 endpoints)

1. **POST /api/tareas** - Crear tarea
2. **GET /api/tareas** - Obtener tareas
3. **POST /api/tareas/ocurrencias** - Materializar ocurrencia
4. **PATCH /api/tareas/ocurrencias** - Cancelar desde fecha

---

## Flujo de Seguridad

1. **Autenticación**: Se valida que exista `orgId` y `userId` (si requerido)
2. **Autorización**: Se verifica el permiso específico con Clerk
3. **Validación de Datos**: Se verifica que el recurso exista
4. **Ejecución**: Solo si todo es válido, se ejecuta la operación

## Error Handling

Todos los endpoints retornan:
- **401 Unauthorized**: No autenticado (`orgId` faltante)
- **403 Forbidden**: Autenticado pero sin permisos necesarios
- **404 Not Found**: Recurso no encontrado
- **400 Bad Request**: Datos inválidos
- **500 Internal Server Error**: Error en el servidor

---

## Testing Recomendado

```bash
# Prueba sin permisos (debe retornar 403)
curl -H "Authorization: Bearer TOKEN" \
     -X GET http://localhost:3000/api/tareas

# Prueba con permisos (debe retornar 200)
curl -H "Authorization: Bearer TOKEN" \
     -X GET http://localhost:3000/api/tareas
```

---

**Última actualización**: Febrero 22, 2026
**Estado**: ✅ Todos los endpoints protegidos
**Verificación de errores**: ✅ Sin errores de compilación
