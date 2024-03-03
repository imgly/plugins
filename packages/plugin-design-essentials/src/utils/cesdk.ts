import { BlockAPI } from "@cesdk/cesdk-js";


export const readPropValue = (block: BlockAPI, id: number, propKey: string, propType?: string) => {
  const blacklist = ["fill/solid/color", "fill/image/sourceSet"]
  if (blacklist.includes(propKey)) return undefined;
  if (!propType) propType = block.getPropertyType(propKey)
  try {
    switch (propType.toLowerCase()) {
      case "string": return block.getString(id, propKey);
      case "float": return block.getFloat(id, propKey);
      case "double": return block.getDouble(id, propKey);
      case "color": return block.getColor(id, propKey);
      case "bool": return block.getBool(id, propKey);
      case "enum": return block.getEnum(id, propKey);
    }
  } catch (e) {
    console.warn("Error reading property value: ", e);
  }
  return undefined;
};


export const writePropValue = (block: BlockAPI, id: number, propKey: string, propValue: any, propType?: string) => {
  if (!propType) propType = block.getPropertyType(propKey)
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
