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

export function deleteBlock(root: Block, id: string): Block {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children.filter((child) => child.id !== id).map((child) => deleteBlock(child, id)),
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
