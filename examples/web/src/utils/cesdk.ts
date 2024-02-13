import CreativeEditorSDK from "@cesdk/cesdk-js";


export const readPropValue = (cesdk: CreativeEditorSDK, id: number, propKey: string, propType: string) => {
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
