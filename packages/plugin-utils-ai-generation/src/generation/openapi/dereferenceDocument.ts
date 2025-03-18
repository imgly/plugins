import { type OpenAPIV3 } from 'openapi-types';

/**
 * Resolves a JSON reference path within a document
 * @param document The OpenAPI document
 * @param refPath The reference path (e.g. "#/components/schemas/MySchema")
 * @returns The resolved object from the document
 */
export function resolveReference(
  document: OpenAPIV3.Document,
  refPath: string
): unknown {
  // Only handle internal references
  if (!refPath.startsWith('#/')) {
    throw new Error(`External references are not supported: ${refPath}`);
  }

  // Remove the leading #/
  const path = refPath.substring(2).split('/');
  let current: any = document;

  // Navigate through the path
  for (const segment of path) {
    if (current === undefined || current === null) {
      throw new Error(`Invalid reference path: ${refPath}`);
    }
    current = current[segment];
  }

  if (current === undefined) {
    throw new Error(`Reference not found: ${refPath}`);
  }

  return current;
}

/**
 * Recursively dereferences all $ref properties in an object
 * @param document The original document for resolving references
 * @param obj The object to dereference
 * @param visited Set of visited objects to prevent circular references
 * @returns The dereferenced object
 */
function dereferenceObject(
  document: OpenAPIV3.Document,
  obj: any,
  visited = new Set<any>()
): any {
  // Handle null or undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If we've seen this object before, return it to avoid circular references
  if (visited.has(obj)) {
    return obj;
  }

  // Add the current object to the visited set
  visited.add(obj);

  // Handle $ref
  if (obj.$ref && typeof obj.$ref === 'string') {
    // Get the referenced object
    const referenced = resolveReference(document, obj.$ref);
    // Dereference the referenced object
    const dereferenced = dereferenceObject(document, referenced, visited);

    // Merge other properties from the original object
    const result = { ...dereferenced };
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && key !== '$ref') {
        result[key] = dereferenceObject(document, obj[key], visited);
      }
    }
    return result;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => dereferenceObject(document, item, visited));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = dereferenceObject(document, obj[key], visited);
      }
    }
    return result;
  }

  // Return primitives as is
  return obj;
}

/**
 * Dereferences all $ref properties in an OpenAPI document
 * @param document The OpenAPI document to dereference
 * @returns A new document with all references resolved
 */
export default function dereferenceDocument(
  document: OpenAPIV3.Document
): OpenAPIV3.Document {
  return dereferenceObject(document, { ...document }) as OpenAPIV3.Document;
}
