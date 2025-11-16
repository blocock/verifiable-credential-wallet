/**
 * Utility for creating canonical JSON representations
 * Ensures deterministic JSON output by recursively sorting object keys
 */
export class JsonCanonicalizer {
  /**
   * Recursively sort object keys to create canonical representation
   * This ensures consistent JSON output regardless of key insertion order
   */
  static canonicalize(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => JsonCanonicalizer.canonicalize(item));
    }

    // Handle objects
    if (typeof obj === 'object') {
      const sorted: Record<string, any> = {};
      const keys = Object.keys(obj).sort();
      
      for (const key of keys) {
        sorted[key] = JsonCanonicalizer.canonicalize(obj[key]);
      }
      
      return sorted;
    }

    // Return primitives as-is
    return obj;
  }

  /**
   * Create a canonical JSON string representation
   */
  static toCanonicalString(obj: any): string {
    const canonical = JsonCanonicalizer.canonicalize(obj);
    return JSON.stringify(canonical);
  }
}

