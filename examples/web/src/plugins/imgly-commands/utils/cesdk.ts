import CreativeEditorSDK from "@cesdk/cesdk-js";


export const readPropValue = (cesdk: CreativeEditorSDK, id: number, propKey: string, propType?: string) => {
  const blacklist= ["fill/solid/color"]
  if (blacklist.includes(propKey)) return undefined;
  if (!propType) propType = cesdk.engine.block.getPropertyType(propKey)
  try {
    switch (propType.toLowerCase()) {
      case "string": return cesdk.engine.block.getString(id, propKey);
      case "float": return cesdk.engine.block.getFloat(id, propKey);
      case "double": return cesdk.engine.block.getDouble(id, propKey);
      case "color": return cesdk.engine.block.getColor(id, propKey);
      case "bool": return cesdk.engine.block.getBool(id, propKey);
      case "enum": return cesdk.engine.block.getEnum(id, propKey);
    }
  } catch(e){ 
    console.warn("Error reading property value: ", e);
  }
  return undefined;
};


export const writePropValue = (cesdk: CreativeEditorSDK, id: number, propKey: string, propValue: any,propType?: string) => {
  if (!propType) propType = cesdk.engine.block.getPropertyType(propKey)
  try {
    switch (propType.toLowerCase()) {
      case "string": return cesdk.engine.block.setString(id, propKey, propValue);
      case "float": return cesdk.engine.block.setFloat(id, propKey, propValue);
      case "double": return cesdk.engine.block.setDouble(id, propKey, propValue);
      case "color": return cesdk.engine.block.setColor(id, propKey, propValue);
      case "bool": return cesdk.engine.block.setBool(id, propKey, propValue);
      case "enum": return cesdk.engine.block.setEnum(id, propKey, propValue);
    }
  } catch(e){ 
    console.warn("Error writing property: ", propKey, propType, propValue);
  }
  return undefined;
};
