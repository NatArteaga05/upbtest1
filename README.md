# Tu inventario

Frontend de gestión de productos con Next.js, conectado a una API Express y PostgreSQL.

## Ejecutar localmente

1. Instala las dependencias: `npm ci`.
2. Copia `.env.example` a `.env` y configura `NEXT_PUBLIC_API_URL` con la URL del backend, sin `/api/productos`.
3. Ejecuta `npm run dev` y abre http://localhost:3000.

```env
NEXT_PUBLIC_API_URL=https://backendupbtest-zgc9.onrender.com
```

Esta variable es pública. No añadas contraseñas ni credenciales de PostgreSQL al frontend. Reinicia el servidor de desarrollo después de cambiarla.

## Funcionalidades

- Listado y búsqueda local por nombre o ID: `GET /api/productos`.
- Consulta de detalle y carga para edición: `GET /api/productos/:id`.
- Creación: `POST /api/productos`.
- Edición: `PUT /api/productos/:id`.
- Eliminación con confirmación: `DELETE /api/productos/:id`.
- Validación, indicadores de carga y mensajes de error/éxito.

Los datos se guardan en el backend, no en el almacenamiento del navegador. Si una operación agota el tiempo de espera, actualiza la lista antes de repetirla: podría haberse completado en el servidor.

## Validar y publicar

- `npm run lint`: revisión de código.
- `npm test`: pruebas del cliente de la API con respuestas simuladas, sin modificar datos reales.
- `npm run build`: compilación y exportación estática a `out/`.

Los workflows de GitHub Actions compilan y publican en Firebase Hosting. Ambos definen `NEXT_PUBLIC_API_URL` durante la compilación, porque el `.env` local no se sube a Git. Si cambia la URL del backend, actualízala también en esos workflows y vuelve a compilar/publicar.

- Frontend previsto: https://upbtest1-23de0.web.app
- Backend: https://backendupbtest-zgc9.onrender.com
- Repositorio backend: https://github.com/NatArteaga05/backendUpbtest

El backend debe permitir el origen del frontend mediante CORS. Esta interfaz no implementa autenticación; la API actual permite operaciones públicas sobre los productos.
