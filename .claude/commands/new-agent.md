Crea un nuevo git worktree para trabajar en paralelo sin bloquear la rama principal.

Uso: /new-agent [nombre-feature]

Pasos:
1. Crea rama: `git worktree add ../patio-[nombre-feature] -b agent/[nombre-feature]`
2. Entra al worktree: `cd ../patio-[nombre-feature]`
3. Lee TASKS.md y AGENT_STATUS.md para entender el contexto
4. Trabaja en la feature indicada
5. Al terminar, reporta el path del worktree para que el usuario haga merge

Si no se pasa nombre, usa la primera tarea pendiente en TASKS.md como nombre.
