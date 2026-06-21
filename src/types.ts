import * as crypto from "node:crypto";

export const LINEAGE_SYMBOL = Symbol("lineage");

export type NodeId = string;

export interface LineageNode {
  id: NodeId;
  source: string;
  operation?: string;
  parentIds: NodeId[];
  timestamp: number;
  valueSnapshot?: unknown;
}

export interface LineageRef {
  [LINEAGE_SYMBOL]: NodeId;
}

export type Tracked<T> = T extends object ? T & LineageRef : never;

export function uuid(): NodeId {
  return crypto.randomUUID();
}
