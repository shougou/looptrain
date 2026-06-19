/**
 * CommandRegistry — v0.7 command definitions and availability filter.
 */

export type CommandDefinition = {
  id: string;
  category: string;
  triggers: string[];
  label: string;
  description: string;
  availableWhen: string;
};

export type CommandAvailabilityState = {
  mode?: string;
  loop?: number;
  knownClues?: string[];
  lastFailure?: unknown;
  hasBeliefs?: boolean;
};

export class CommandRegistry {
  private commands: Record<string, CommandDefinition> = {};

  constructor(definitions: CommandDefinition[]) {
    for (const def of definitions) {
      this.commands[def.id] = def;
    }
  }

  getAll(): CommandDefinition[] {
    return Object.values(this.commands);
  }

  getById(id: string): CommandDefinition | undefined {
    return this.commands[id];
  }

  getAvailable(state: CommandAvailabilityState): CommandDefinition[] {
    return this.getAll().filter(cmd => {
      switch (cmd.availableWhen) {
        case 'always':
          return true;
        case 'in_dialogue':
          return state.mode === 'dialogue';
        case 'after_failure':
          return !!state.lastFailure;
        case 'loop_gt_1':
          return (state.loop || 1) > 1;
        case 'has_carryover':
          return (state.knownClues && state.knownClues.length > 0) || (state.loop || 1) > 1;
        case 'has_beliefs':
          return !!state.hasBeliefs;
        default:
          return true;
      }
    });
  }
}
