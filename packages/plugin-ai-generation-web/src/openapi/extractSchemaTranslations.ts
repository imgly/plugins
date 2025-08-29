import { Property } from './types';
import Provider, { Output, OutputKind } from '../core/provider';
import { UIOptions } from '../types';
import { defaultTranslations } from './defaultTranslations';

function formatEnumLabel(enumValue: string): string {
  return (
    enumValue
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Handle specific cases first
      .replace(/\b3d\b/gi, '3D')
      .replace(/\b2d\b/gi, '2D')
      // Capitalize each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

/**
 * Extracts translations from OpenAPI schema properties and sets them via cesdk.i18n
 * This includes:
 * - Schema property titles as `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}`
 * - Enum value labels as `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}.${valueId}`
 * - AnyOf enum value labels with the same pattern
 */
export function extractAndSetSchemaTranslations<
  K extends OutputKind,
  I,
  O extends Output
>(
  properties: Property[],
  provider: Provider<K, I, O>,
  options: UIOptions,
  kind: K
): void {
  const translations: Record<string, string> = {};

  const createTranslationKey = (propertyId: string, valueId?: string): string =>
    `ly.img.plugin-ai-${kind}-generation-web.${
      provider.id
    }.defaults.property.${propertyId}${valueId ? `.${valueId}` : ''}`;

  const extractEnumLabels = (schema: any): Record<string, string> =>
    'x-imgly-enum-labels' in schema &&
    typeof schema['x-imgly-enum-labels'] === 'object'
      ? (schema['x-imgly-enum-labels'] as Record<string, string>)
      : {};

  const addEnumTranslations = (
    enumValues: any[],
    propertyId: string,
    enumLabels: Record<string, string>
  ): void => {
    enumValues.forEach((enumValue) => {
      const valueId = String(enumValue);
      const labelValue = enumLabels[valueId] || formatEnumLabel(valueId);
      translations[createTranslationKey(propertyId, valueId)] = labelValue;
    });
  };

  properties.forEach((property) => {
    if (property.schema?.title) {
      translations[createTranslationKey(property.id)] = property.schema.title;
    }

    if (property.schema?.enum) {
      const enumLabels = extractEnumLabels(property.schema);
      addEnumTranslations(property.schema.enum, property.id, enumLabels);
    }

    if (property.schema?.anyOf && Array.isArray(property.schema.anyOf)) {
      const enumLabels = extractEnumLabels(property.schema);

      property.schema.anyOf.forEach((anySchema) => {
        const schema = anySchema as any;
        if (schema.enum && Array.isArray(schema.enum)) {
          addEnumTranslations(schema.enum, property.id, enumLabels);
        } else if (schema.$ref) {
          const refName = schema.$ref.split('/').pop();
          if (refName && enumLabels[refName]) {
            translations[createTranslationKey(property.id, refName)] =
              enumLabels[refName];
          }
        } else if (schema.title) {
          const refName = schema.title;
          const labelValue = enumLabels[refName] || formatEnumLabel(refName);
          translations[createTranslationKey(property.id, refName)] = labelValue;
        }
      });
    }
  });

  const allTranslations = { ...defaultTranslations, ...translations };

  if (Object.keys(allTranslations).length > 0) {
    options.cesdk.i18n.setTranslations({
      en: allTranslations
    });
  }
}
