type SortableEntry = {
  data: {
    date?: Date;
    pinned?: boolean;
  };
};

function timestamp(entry: SortableEntry): number {
  return entry.data.date?.getTime() ?? Number.NEGATIVE_INFINITY;
}

export function sortByPinnedThenDate<T extends SortableEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const pinnedDiff = Number(Boolean(b.data.pinned)) - Number(Boolean(a.data.pinned));
    if (pinnedDiff !== 0) return pinnedDiff;
    return timestamp(b) - timestamp(a);
  });
}
