import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import addToCanvasMenu from '../generation/addToCanvasMenu';
import { QuickActionCanvasMenuComponents } from '../generation/quickAction/types';

describe('addToCanvasMenu', () => {
  let mockCesdk: jest.Mocked<CreativeEditorSDK>;

  beforeEach(() => {
    mockCesdk = {
      ui: {
        getCanvasMenuOrder: jest.fn(),
        setCanvasMenuOrder: jest.fn()
      }
    } as any;
  });

  it('should add new components to the beginning of canvas menu', () => {
    const existingOrder = [{ id: 'existing.component', label: 'Existing' }];
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['image.child1', 'image.child2']
      },
      text: {
        id: 'ly.img.ai.text.canvasMenu',
        children: ['text.child1']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['image.child1', 'image.child2']
      },
      {
        id: 'ly.img.ai.text.canvasMenu',
        children: ['text.child1']
      },
      { id: 'existing.component', label: 'Existing' }
    ]);
  });

  it('should update existing component children instead of adding duplicate', () => {
    const existingOrder = [
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['existing.child1', 'existing.child2']
      },
      { id: 'other.component', label: 'Other' }
    ];
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['new.child1', 'new.child2']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: [
          'existing.child1',
          'existing.child2',
          'new.child1',
          'new.child2'
        ]
      },
      { id: 'other.component', label: 'Other' }
    ]);
  });

  it('should not add duplicate children when they already exist', () => {
    const existingOrder = [
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['existing.child1', 'existing.child2']
      },
      { id: 'other.component', label: 'Other' }
    ];
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['existing.child1', 'new.child1']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['existing.child1', 'existing.child2', 'new.child1']
      },
      { id: 'other.component', label: 'Other' }
    ]);
  });

  it('should handle empty components object', () => {
    const existingOrder = [{ id: 'existing.component', label: 'Existing' }];
    const components: QuickActionCanvasMenuComponents = {};

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith(existingOrder);
  });

  it('should handle empty existing canvas menu', () => {
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['image.child1']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue([]);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['image.child1']
      }
    ]);
  });

  it('should add children property when component has no children', () => {
    const existingOrder = [
      { id: 'ly.img.ai.image.canvasMenu', label: 'Image AI' },
      { id: 'other.component', label: 'Other' }
    ];
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['new.child1']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        label: 'Image AI',
        children: ['new.child1']
      },
      { id: 'other.component', label: 'Other' }
    ]);
  });

  it('should replace non-array children with array children', () => {
    const existingOrder = [
      { id: 'ly.img.ai.image.canvasMenu', children: 'not-an-array' },
      { id: 'other.component', label: 'Other' }
    ];
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['new.child1']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['new.child1']
      },
      { id: 'other.component', label: 'Other' }
    ]);
  });

  it('should preserve existing separators in children arrays and not duplicate them', () => {
    const existingOrder = [
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['existing.child1', 'ly.img.separator', 'existing.child2']
      },
      { id: 'other.component', label: 'Other' }
    ];
    const components: QuickActionCanvasMenuComponents = {
      image: {
        id: 'ly.img.ai.image.canvasMenu',
        children: ['new.child1', 'ly.img.separator']
      }
    };

    mockCesdk.ui.getCanvasMenuOrder.mockReturnValue(existingOrder);

    addToCanvasMenu(mockCesdk, components);

    expect(mockCesdk.ui.setCanvasMenuOrder).toHaveBeenCalledWith([
      {
        id: 'ly.img.ai.image.canvasMenu',
        children: [
          'existing.child1',
          'ly.img.separator',
          'existing.child2',
          'new.child1',
          'ly.img.separator'
        ]
      },
      { id: 'other.component', label: 'Other' }
    ]);
  });
});
