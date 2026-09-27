type CollectionMembership = {
  id: string;
  patioIds: readonly string[];
};

export type LibraryMoveSelection = {
  candidateSourceCollectionIds: string[];
  sourceCollectionIds: string[];
  patioIds: string[];
  unscopedPatioIds: string[];
  canMove: boolean;
  requiresSourceChoice: boolean;
};

// Active lists define the move scope. In Todos, memberships only identify
// possible sources: the person must choose which lists to move from.
export function resolveLibraryMoveSelection({
  collections,
  activeCollectionIds,
  selectedPatioIds,
}: {
  collections: readonly CollectionMembership[];
  activeCollectionIds: readonly string[];
  selectedPatioIds: Iterable<string>;
}): LibraryMoveSelection {
  const selected = [...new Set(selectedPatioIds)];
  const selectedSet = new Set(selected);
  const existingIds = new Set(collections.map((collection) => collection.id));
  const sourceCollectionIds = [...new Set(activeCollectionIds)].filter((id) => existingIds.has(id));
  const candidateSourceCollectionIds = [...new Set(collections
    .filter((collection) => collection.patioIds.some((id) => selectedSet.has(id)))
    .map((collection) => collection.id))];
  const scopeIds = new Set(sourceCollectionIds.length ? sourceCollectionIds : candidateSourceCollectionIds);
  const scopedPatioIds = new Set(collections
    .filter((collection) => scopeIds.has(collection.id))
    .flatMap((collection) => collection.patioIds));
  const unscopedPatioIds = selected.filter((id) => !scopedPatioIds.has(id));
  const canMove = selected.length > 0 && unscopedPatioIds.length === 0;

  return {
    candidateSourceCollectionIds,
    sourceCollectionIds,
    // A partially eligible selection must never become a silent partial move.
    patioIds: canMove ? selected : [],
    unscopedPatioIds,
    canMove,
    requiresSourceChoice: canMove && sourceCollectionIds.length === 0,
  };
}
