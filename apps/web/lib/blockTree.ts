import type { Block } from "@/components/blocks/types";

export function findBlock(root: Block, id: string): Block | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findBlock(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: Block, childId: string): Block | null {
  for (const child of root.children ?? []) {
    if (child.id === childId) return root;
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}

export function addBlock(root: Block, parentId: string, block: Block): Block {
  if (root.id === parentId) {
    return { ...root, children: [...(root.children ?? []), block] };
  }
  if (!root.children) return root;
  return { ...root, children: root.children.map((child) => addBlock(child, parentId, block)) };
}

export function addBlockAt(root: Block, parentId: string, block: Block, index: number): Block {
  return updateBlock(root, parentId, (parent) => {
    const children = [...(parent.children ?? [])];
    const clamped = Math.max(0, Math.min(index, children.length));
    children.splice(clamped, 0, block);
    return { ...parent, children };
  });
}

// Moves an existing block to `index` within `newParentId`'s children.
// No-ops if the move would drop a block into its own subtree.
export function moveBlock(root: Block, blockId: string, newParentId: string, index: number): Block {
  const block = findBlock(root, blockId);
  const oldParent = findParent(root, blockId);
  if (!block || !oldParent) return root;
  if (findBlock(block, newParentId)) return root;

  let targetIndex = index;
  if (oldParent.id === newParentId) {
    const oldIndex = (oldParent.children ?? []).findIndex((c) => c.id === blockId);
    if (oldIndex !== -1 && oldIndex < targetIndex) targetIndex -= 1;
  }

  const without = deleteBlock(root, blockId);
  const parent = findBlock(without, newParentId);
  if (!parent || !parent.children) return root;
  const clamped = Math.max(0, Math.min(targetIndex, parent.children.length));
  return updateBlock(without, newParentId, (p) => {
    const children = [...(p.children ?? [])];
    children.splice(clamped, 0, block);
    return { ...p, children };
  });
}

export function deleteBlock(root: Block, id: string): Block {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.filter((child) => child.id !== id).map((child) => deleteBlock(child, id)),
  };
}

// Detached-copy insert for saved/reusable blocks: every id in the subtree
// is regenerated so the inserted copy has no relation to the original once
// placed (see components/editor/EditorClient.tsx for the linked-vs-detached
// decision).
export function cloneWithNewIds(block: Block): Block {
  return {
    ...block,
    id: crypto.randomUUID(),
    children: block.children?.map(cloneWithNewIds),
  };
}

export function updateBlock(
  root: Block,
  id: string,
  updater: (block: Block) => Block,
): Block {
  if (root.id === id) return updater(root);
  if (!root.children) return root;
  return { ...root, children: root.children.map((child) => updateBlock(child, id, updater)) };
}
