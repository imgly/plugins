import { BlockAPI } from "@cesdk/cesdk-js";



export const setBlockProperty = (block: BlockAPI, id: number, propKey: string, propValue: any, propType?: string) => {
  if (!propType) propType = block.getPropertyType(propKey);
  try {
    switch (propType.toLowerCase()) {
      case "string": return block.setString(id, propKey, propValue);
      case "float": return block.setFloat(id, propKey, propValue);
      case "double": return block.setDouble(id, propKey, propValue);
      case "color": return block.setColor(id, propKey, propValue);
      case "bool": return block.setBool(id, propKey, propValue);
      case "enum": return block.setEnum(id, propKey, propValue);
    }
  } catch (e) {
    console.warn("Error writing property: ", propKey, propType, propValue);
  }
  return undefined;
};
