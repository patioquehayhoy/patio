import { requireOptionalNativeModule } from 'expo-modules-core';

import { handleVisitTaskEvent, VISITS_TASK } from './visits';

// La tarea de geocercas se define al cargar la app (también cuando el sistema
// la despierta en segundo plano por una geocerca). Solo existe en los builds
// que ya traen `expo-task-manager`; en los anteriores no hace nada.
if (requireOptionalNativeModule('ExpoTaskManager')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Location = require('expo-location') as typeof import('expo-location');
  TaskManager.defineTask<{ eventType: number; region: { identifier?: string } }>(VISITS_TASK, async ({ data, error }) => {
    if (error || !data?.region?.identifier) return;
    const type = data.eventType === Location.GeofencingEventType.Enter ? 'enter'
      : data.eventType === Location.GeofencingEventType.Exit ? 'exit' : null;
    if (!type) return;
    await handleVisitTaskEvent({ type, id: data.region.identifier }).catch(() => {});
  });
}
