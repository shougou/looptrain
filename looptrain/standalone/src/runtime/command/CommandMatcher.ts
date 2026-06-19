/**
 * CommandMatcher — matches free-text input to command definitions.
 * v0.7: exact-match first, then substring containment.
 */

import type { CommandDefinition } from './CommandRegistry';
import type { CommandRegistry as CommandRegistryClass } from './CommandRegistry';

export function matchCommand(
  input: string,
  registry: { getAll(): CommandDefinition[] },
): CommandDefinition | null {
  const text = (input || '').trim().toLowerCase();
  if (!text) return null;

  const all = registry.getAll();

  // Try exact match first
  for (const cmd of all) {
    for (const trigger of cmd.triggers) {
      if (trigger.toLowerCase() === text) return cmd;
    }
  }

  // Try contains match
  for (const cmd of all) {
    for (const trigger of cmd.triggers) {
      if (text.includes(trigger.toLowerCase())) return cmd;
    }
  }

  return null;
}
