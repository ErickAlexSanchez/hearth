# Hearth — plan de implementación

Este archivo es el contrato de la carpeta `03-hearth`. Quien implemente trabaja solo con lo que está escrito aquí.

## 1. Relato de portafolio

Cada repositorio público es una versión de portafolio de un sistema real. La empresa tiene una política de confidencialidad que impide mostrar el proyecto real. Esta versión sigue las mismas decisiones de arquitectura, con otro alcance, otra marca y otros datos. Existe solo para enseñarla en el portafolio.

Párrafo obligatorio en el README, en inglés, tal cual:

> This is a portfolio version of a production system I built for a company whose confidentiality policy does not allow the real product to be shown. The original work cannot be published. This repository is a different version, created only for the portfolio: it follows the same architecture decisions, with a different scope, brand, and data. It is not the client's codebase.

Reglas del relato, en los seis:

- El README abre con ese párrafo, antes de la arquitectura.
- Marca ficticia y datos sintéticos. El código, el esquema y la UI son de esta versión.
- El README público no nombra al cliente, no usa codenames internos y no incluye métricas, citas ni tamaño de equipo inventados.
- El nombre del empleador no aparece en el código ni en el README. El CV ya cuenta el contexto laboral.
- Un ADR (`docs/adr/0001-portfolio-version.md`) repite el mismo hecho en una página y enlaza el ADR de la decisión técnica.
- Ningún asset, dump, captura o texto proviene del sistema real.

## 2. Límites

- La carpeta de este repositorio es `03-hearth`. El git vive solo ahí.
- `resume-projects` no tiene `.git`. Nadie corre `git init` en `resume-projects`.
- Al empezar la implementación, `git init` se corre solo dentro de `03-hearth`.
- El remoto es un repositorio vacío distinto. El nombre del remoto es `hearth`, bajo la cuenta que se indique.
- Prohibido leer o editar las carpetas hermanas (`01-lumen`, `02-draftline`, `04-commerce`, `05-slot`, `06-pathmark`) y el resto del workspace.
- No hay paquete compartido entre carpetas. Copiar una idea está permitido. Importar código de otra carpeta, no.
- Desde esta máquina no se hace push ni se abre un PR. El comando de push, si hace falta, se copia y se pega en la VDI. No se escribe aquí.
- El índice local, `docs/PUBLISH.md` y `docs/AGENT-HANDOFF.md` del workspace no entran en este git.
- Autor del commit: `user.name` y `user.email` de esta máquina. Sin `Co-authored-by`, sin `Made with Cursor`, sin `cursoragent@cursor.com`.
- Commits convencionales, dentro de `03-hearth`, cuando el trabajo de esta carpeta esté listo. Sin `--no-verify`. Sin amend.
- `.gitignore` de este repo cubre `node_modules`, `.env`, `.next`, `dist`, `coverage`, `playwright-report`.
- CI de este repo: GitHub Actions con typecheck, lint, test y e2e. El workflow vive en este repo.

## 3. Barra de staff engineer

Esta barra es criterio de hecho. Un staff engineer debe poder leer el repo y ver la decisión, el límite del módulo y la prueba que la protege.

### Arquitectura

- `docs/adr/0001-portfolio-version.md` y `docs/adr/0002-decision.md` con contexto, decisión y consecuencias.
- La lógica de dominio no importa framework, React ni el driver de Postgres.
- Los bordes (HTTP, SQL, Stripe, modelo, video, disco) son adaptadores detrás de un puerto.
- La composición (crear repos, elegir el adaptador falso o el real) ocurre en un solo lugar de arranque.
- El diagrama del README coincide con los directorios reales.

### Código

- TypeScript strict, `noUncheckedIndexedAccess`. Cero `any`. Cero `@ts-ignore`. Un `eslint-disable` lleva el motivo en la línea de arriba.
- Zod, o un validador equivalente, en cada entrada HTTP, webhook y variable de entorno. El proceso no arranca si el env está incompleto.
- Errores tipados. Ningún `catch` vacío. Los errores de dominio se traducen a HTTP en el borde.
- SQL parametrizado. Migraciones versionadas en el repo. El seed es otro comando.
- Logs estructurados con id de request. Sin secretos, tokens ni contenido de coach en los logs.
- El camino crítico no lleva `TODO` ni código comentado.

### Pruebas

- Jest en la regla de dominio pura.
- Una prueba de integración contra Postgres (Testcontainers o el Postgres de Compose) para el invariante de arquitectura de ese plan.
- React Testing Library en el estado de UI que el plan nombra.
- Un e2e con Playwright del recorrido principal.
- La prueba del invariante falla si se quita la guarda. No se acepta un test que solo espía un mock del mismo módulo que decide.

### Frontend

- UI en inglés.
- WCAG 2.2 AA en las pantallas entregadas: teclado, nombre accesible, foco visible, contraste.
- Cada vista de datos tiene estado de carga, vacío y error.
- TanStack Query es el dueño del estado de servidor donde el plan lo usa. Redux solo guarda UI, y solo en Hearth.

### Seguridad

- Toda lectura privada y toda escritura comprueban autorización en el servidor.
- Los secretos viven en env. Hay `.env.example` sin valores reales.
- Los headers de caché del plan tienen prueba.
- Webhooks de Stripe y de video verifican la firma. El simulador local firma con el secreto de desarrollo.

### Entrega

- `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test` y `pnpm dev` funcionan en Windows.
- `docker compose up` levanta Postgres donde el plan lo pide.
- README en inglés: párrafo de confidencialidad, decisión, diagrama, cómo correr, cómo probar, tradeoffs, fuera de alcance.
- Health check en cada API.
- El worker, si existe, cierra bien al recibir SIGTERM.

## 4. Decisión, versión de portafolio y alcance

Carpeta `03-hearth`. Git solo ahí. Remoto `hearth`.

### Decisión del CV

Monolito modular. Postgres es la fuente de verdad. El entitlement se comprueba en el servidor. Los datos del coach viven aislados del feed, con acceso más estricto y retención más corta. TanStack Query pagina el feed. Redux guarda estado de UI. El coach responde en stream y esa respuesta no se cachea. Las lecturas del feed pasan por un seam de réplica.

### Cómo difiere esta versión

Feed corto, coach de hábitos con aviso visible de que no es consejo médico, sin diagnóstico ni dosis. Marca Hearth.

### Stack

React, TypeScript, Next.js, TanStack Query, Redux Toolkit, Postgres.

### Módulos

Cada uno con su schema Postgres: identity, membership, feed, coach. El módulo feed no importa tablas del coach. El coach no importa tablas del feed. Puerto `CoachResponder` con adaptador falso. Las lecturas del feed usan `DATABASE_READ_URL`. En local esa URL apunta al mismo Postgres.

### Alcance

- Feed con cursor. Un post de miembros responde 403 a un usuario free.
- Redux guarda compositor abierto y borrador local. Las páginas del feed no leen posts desde Redux.
- SSE del coach con `Cache-Control: no-store`.
- Un comando de retención borra mensajes de coach más viejos que la ventana configurada y deja los posts intactos.

### Hecho cuando

Además de la barra común: el test de entitlement cubre 403; el test de retención borra coach y conserva feed; el test de headers cubre no-store; un test de arquitectura falla si feed importa el schema coach; el e2e publica en el feed y abre el coach.

### Fuera de v1

Réplica física, grafo social, app móvil, historial clínico.
