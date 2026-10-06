export type CategoryNode = { id: string; name: string; slug: string; parent_id: string | null; sort_order: number };
export function categoryPath(categories: CategoryNode[], id: string | null) {
  const category = categories.find(c => c.id === id);
  if (!category) return [];
  const parent = categories.find(c => c.id === category.parent_id);
  return (parent ? [parent, category] : [category]).map(({ id, name, slug }) => ({ id, name, slug }));
}
export function categoryOptions<T extends CategoryNode>(categories: T[]): (T & { label: string })[] {
  return categories.filter(c => !c.parent_id).sort((a,b) => a.sort_order-b.sort_order || a.name.localeCompare(b.name)).flatMap(root => [
    { ...root, label: root.name },
    ...categories.filter(c => c.parent_id === root.id).sort((a,b) => a.sort_order-b.sort_order || a.name.localeCompare(b.name)).map(c => ({ ...c, label: `${root.name} / ${c.name}` })),
  ]);
}
