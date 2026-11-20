import { ImportValidationError } from "./validation";
import type { Fields } from "./workbuddyAttribution";

export class WorkBuddyOrder {
  private nodes = new Map<string, { type: string; parent?: string }>();

  add(event: Fields & { type: string }) {
    if (typeof event.id !== "string" || !event.id) return;
    const parent = event.parentId ?? undefined;
    if (
      (parent !== undefined && (typeof parent !== "string" || !parent)) ||
      (parent === undefined && event.logicalParentId != null)
    )
      throw new ImportValidationError("transcript");
    const previous = this.nodes.get(event.id);
    if (
      previous &&
      (previous.parent !== parent || previous.type !== event.type)
    )
      throw new ImportValidationError("transcript");
    this.nodes.set(event.id, { type: event.type, parent });
  }

  replay<T>(candidates: Map<string, T>): T[] {
    const needed = new Set<string>();
    const children = new Map<string, string>();
    const roots: string[] = [];
    for (const id of candidates.keys()) {
      let cursor: string | undefined = id;
      while (cursor !== undefined && !needed.has(cursor)) {
        needed.add(cursor);
        const node = this.nodes.get(cursor);
        if (!node) throw new ImportValidationError("transcript");
        if (node.parent === undefined) roots.push(cursor);
        else {
          if (children.has(node.parent))
            throw new ImportValidationError("transcript");
          children.set(node.parent, cursor);
        }
        cursor = node.parent;
      }
    }
    if (!children.size) return [...candidates.values()];
    if (roots.length !== 1) throw new ImportValidationError("transcript");
    const ordered: T[] = [];
    let visited = 0;
    for (
      let id: string | undefined = roots[0];
      id !== undefined;
      id = children.get(id)
    ) {
      const item = candidates.get(id);
      if (item !== undefined) ordered.push(item);
      visited++;
    }
    if (visited !== needed.size) throw new ImportValidationError("transcript");
    return ordered;
  }
}
