/**
 * Model Registry — enables runtime swapping between different
 * sign language detection models without losing app state.
 *
 * Usage:
 *   const registry = getModelRegistry();
 *   registry.register('mediapipe', { ... });
 *   const provider = registry.create('mediapipe');
 *   await provider.initialize();
 */

import type { SignDetectionProvider, ModelRegistryEntry } from "./types";

class ModelRegistry {
  private entries = new Map<string, ModelRegistryEntry>();
  private activeProvider: SignDetectionProvider | null = null;

  register(entry: ModelRegistryEntry): void {
    this.entries.set(entry.name, entry);
  }

  unregister(name: string): void {
    this.entries.delete(name);
  }

  list(): ModelRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  get(name: string): ModelRegistryEntry | undefined {
    return this.entries.get(name);
  }

  /** Create a new provider instance by name */
  create(name: string): SignDetectionProvider {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new Error(
        `Model "${name}" not found. Available: ${Array.from(this.entries.keys()).join(", ")}`
      );
    }
    return entry.factory();
  }

  /** Switch the active provider. Disposes the old one, initializes the new one. */
  async switchTo(name: string): Promise<SignDetectionProvider> {
    if (this.activeProvider) {
      this.activeProvider.dispose();
      this.activeProvider = null;
    }

    const provider = this.create(name);
    await provider.initialize();
    this.activeProvider = provider;
    return provider;
  }

  getActive(): SignDetectionProvider | null {
    return this.activeProvider;
  }

  disposeActive(): void {
    if (this.activeProvider) {
      this.activeProvider.dispose();
      this.activeProvider = null;
    }
  }
}

// Singleton instance
let registryInstance: ModelRegistry | null = null;

export function getModelRegistry(): ModelRegistry {
  if (!registryInstance) {
    registryInstance = new ModelRegistry();
  }
  return registryInstance;
}

export { ModelRegistry };
