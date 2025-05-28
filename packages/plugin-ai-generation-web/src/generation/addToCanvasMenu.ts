import CreativeEditorSDK from '@cesdk/cesdk-js';
import { QuickActionCanvasMenuComponents } from './quickAction/types';

function addToCanvasMenu(
  cesdk: CreativeEditorSDK,
  components: QuickActionCanvasMenuComponents
): void {
  const currentCanvasMenuOrder = cesdk.ui.getCanvasMenuOrder();
  const componentsArray = Object.values(components).filter((component) => {
    // Is this component already in the canvas menu? In that case update the order.
    // Allow ly.img.separator to be added multiple times by never finding existing ones
    const currentCanvasMenuCompnent = currentCanvasMenuOrder.find((item) => {
      return item.id === component.id;
    });
    if (currentCanvasMenuCompnent != null) {
      if (
        'children' in currentCanvasMenuCompnent &&
        Array.isArray(currentCanvasMenuCompnent.children)
      ) {
        const existingChildren = currentCanvasMenuCompnent.children as string[];
        const newChildren = component.children.filter(
          (childId) =>
            !existingChildren.includes(childId) ||
            childId === 'ly.img.separator'
        );
        currentCanvasMenuCompnent.children = [
          ...existingChildren,
          ...newChildren
        ];
      } else {
        currentCanvasMenuCompnent.children = component.children;
      }
      return false;
    }
    return true;
  });
  cesdk.ui.setCanvasMenuOrder([...componentsArray, ...currentCanvasMenuOrder]);
}

export default addToCanvasMenu;
