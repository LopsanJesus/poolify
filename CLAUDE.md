@AGENTS.md

## Commits
Tras cada cambio aprobado por el usuario, hacer commit automáticamente. El push lo hace el usuario manualmente. Nunca hacer push.

## UX: Transiciones, animaciones y estados de carga
Toda la app debe dar feedback visual inmediato al usuario:
- **Transiciones de página**: usar `template.tsx` con framer-motion en cada route group. Ya implementado en `(dashboard)` y `(auth)`.
- **Estados de carga**: crear `loading.tsx` con skeletons (clase `.skeleton`) en cada ruta que haga fetches a Supabase.
- **Feedback de click**: gestionado globalmente en `globals.css` — `filter: brightness(0.8)` en `a:active` y `button:active`. No añadir por cada elemento.
- **Nuevas páginas**: seguir el mismo patrón — `loading.tsx` con skeletons que imiten la estructura visual de la página, clase `.skeleton` para los placeholders.
- **Clases disponibles**: `.skeleton` (shimmer animado), `.animate-in` (fade-in con stagger).
