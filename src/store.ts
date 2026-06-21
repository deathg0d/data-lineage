import { LineageNode, NodeId } from "./types";

const nodeStore = new Map<NodeId, LineageNode>();
const refCount = new Map<NodeId, number>();

export function registerNode(node: LineageNode): void {
  nodeStore.set(node.id, node);
  refCount.set(node.id, 0);
  for (const parentId of node.parentIds) {
    refCount.set(parentId, (refCount.get(parentId) ?? 0) + 1);
  }
}

export function lookupNode(id: NodeId): LineageNode | undefined {
  return nodeStore.get(id);
}

function cascadeEvict(id: NodeId): void {
  const count = refCount.get(id) ?? 0;
  if (count > 0) return; // still has live children
  
  const node = nodeStore.get(id);
  if (!node) return;
  
  nodeStore.delete(id);
  refCount.delete(id);
  
  for (const parentId of node.parentIds) {
    refCount.set(parentId, (refCount.get(parentId) ?? 1) - 1);
    cascadeEvict(parentId); // recurse only if count dropped to 0
  }
}

// Automatically evict when the tracked object is GC'd
const registry = new FinalizationRegistry((id: NodeId) => {
  cascadeEvict(id);
});

export function registerTracked(value: object, id: NodeId): void {
  registry.register(value, id);
}

// Optional: flush old entries for long-running processes as fallback
export function evictBefore(timestamp: number): void {
  const candidates = [...nodeStore.entries()]
    .filter(([id, node]) => 
      node.timestamp < timestamp && (refCount.get(id) ?? 0) === 0
    )
    .map(([id]) => id);
  
  for (const id of candidates) cascadeEvict(id);
}

export function clearAll(): void {
  nodeStore.clear();
  refCount.clear();
}
