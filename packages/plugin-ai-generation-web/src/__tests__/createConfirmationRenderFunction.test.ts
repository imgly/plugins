import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import createConfirmationRenderFunction from '../ui/panels/createConfirmationRenderFunction';
import { BuilderRenderFunctionContext } from '@cesdk/cesdk-js';
import { InferenceMetadata } from '../ui/quickActions/types';
import { AI_METADATA_KEY } from '../ui/quickActions/utils';
import { OutputKind } from '../core/provider';
import { Callbacks } from '../generation/CallbacksRegistry';

// Mock the plugin-utils module
jest.mock('@imgly/plugin-utils', () => {
  const mockMetadataInstance = {
    get: jest.fn(),
    clear: jest.fn()
  };
  const MockMetadata = jest.fn(() => mockMetadataInstance);

  // Store these for use in tests
  (MockMetadata as any)._mockMetadataInstance = mockMetadataInstance;

  return {
    Metadata: MockMetadata
  };
});

// Mock cesdk global
const mockCesdk = {
  engine: {
    editor: {
      _update: jest.fn()
    }
  },
  i18n: {
    setTranslations: jest.fn()
  }
};
(global as any).cesdk = mockCesdk;

describe('createConfirmationRenderFunction', () => {
  let mockEngine: any;
  let mockBuilder: any;
  let mockState: any;
  let mockBuilderContext: BuilderRenderFunctionContext<Callbacks>;
  let mockMetadataInstance: any;
  let MockMetadata: any;
  let testKind: OutputKind;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked module
    const mockedModule = jest.requireMock('@imgly/plugin-utils') as {
      Metadata: any;
    };
    MockMetadata = mockedModule.Metadata;
    mockMetadataInstance = (MockMetadata as any)._mockMetadataInstance;

    mockEngine = {
      block: {
        findAllSelected: jest.fn()
      }
    };

    mockBuilder = {
      Button: jest.fn(),
      Separator: jest.fn(),
      ButtonGroup: jest.fn()
    };

    mockState = jest.fn();
    testKind = 'image';

    mockBuilderContext = {
      engine: mockEngine,
      builder: mockBuilder,
      state: mockState,
      payload: {
        unlock: jest.fn(),
        abort: jest.fn(),
        onCancelGeneration: jest.fn(),
        applyCallbacks: undefined
      },
      renderOptimizedSmallViewport: false,
      experimental: {
        builder: mockBuilder,
        global: {}
      }
    } as unknown as BuilderRenderFunctionContext<Callbacks>;
  });

  describe('factory function behavior', () => {
    it('should return a promise that resolves to a builder render function', async () => {
      const renderFunction = await createConfirmationRenderFunction({
        kind: testKind,
        cesdk: mockCesdk as any
      });

      expect(typeof renderFunction).toBe('function');
    });

    it('should create different prefixes for different kinds', async () => {
      const imageRenderFunction = await createConfirmationRenderFunction({
        kind: 'image',
        cesdk: mockCesdk as any
      });
      const videoRenderFunction = await createConfirmationRenderFunction({
        kind: 'video',
        cesdk: mockCesdk as any
      });

      expect(typeof imageRenderFunction).toBe('function');
      expect(typeof videoRenderFunction).toBe('function');
      // Both should be functions, actual prefix testing happens in the render tests
    });
  });

  describe('returned render function behavior', () => {
    let renderFunction: any;
    let expectedPrefix: string;

    beforeEach(async () => {
      renderFunction = await createConfirmationRenderFunction({
        kind: testKind,
        cesdk: mockCesdk as any
      });
      expectedPrefix = `ly.img.ai.${testKind}.confirmation`;
    });

    describe('early returns', () => {
      it('should return early when payload is undefined', () => {
        mockBuilderContext.payload = undefined;

        const result = renderFunction(mockBuilderContext);

        expect(result).toBeUndefined();
        expect(mockEngine.block.findAllSelected).not.toHaveBeenCalled();
      });

      it('should return null when no blocks are selected', () => {
        mockEngine.block.findAllSelected.mockReturnValue([]);

        const result = renderFunction(mockBuilderContext);

        expect(result).toBeNull();
        expect(mockEngine.block.findAllSelected).toHaveBeenCalled();
      });

      it('should return null when metadata is null', () => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1']);
        mockMetadataInstance.get.mockReturnValue(null);

        const result = renderFunction(mockBuilderContext);

        expect(result).toBeNull();
        expect(mockMetadataInstance.get).toHaveBeenCalledWith('block1');
      });
    });

    describe('processing status', () => {
      beforeEach(() => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1']);
        mockMetadataInstance.get.mockReturnValue({
          status: 'processing',
          quickActionId: 'test-action'
        } as InferenceMetadata);
      });

      it('should render processing UI correctly', () => {
        renderFunction(mockBuilderContext);

        expect(mockBuilder.Button).toHaveBeenCalledWith(
          `${expectedPrefix}.spinner`,
          {
            label: ['ly.img.ai.test-action.processing', 'ly.img.ai.processing'],
            isLoading: true
          }
        );

        expect(mockBuilder.Separator).toHaveBeenCalledWith(
          `${expectedPrefix}.separator`
        );

        expect(mockBuilder.Button).toHaveBeenCalledWith(
          `${expectedPrefix}.cancel`,
          {
            icon: '@imgly/Cross',
            tooltip: `${expectedPrefix}.cancel`,
            onClick: expect.any(Function)
          }
        );
      });

      it('should handle cancel button click during processing', () => {
        renderFunction(mockBuilderContext);

        const cancelButtonCall = mockBuilder.Button.mock.calls.find(
          (call: any) => call[0] === `${expectedPrefix}.cancel`
        );
        const cancelOnClick = cancelButtonCall[1].onClick;

        cancelOnClick();

        expect(
          mockBuilderContext.payload!.onCancelGeneration
        ).toHaveBeenCalled();
        expect(mockMetadataInstance.clear).toHaveBeenCalledWith('block1');
      });

      it('should clear metadata for multiple selected blocks', () => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1', 'block2']);

        renderFunction(mockBuilderContext);

        const cancelButtonCall = mockBuilder.Button.mock.calls.find(
          (call: any) => call[0] === `${expectedPrefix}.cancel`
        );
        const cancelOnClick = cancelButtonCall[1].onClick;

        cancelOnClick();

        expect(mockMetadataInstance.clear).toHaveBeenCalledWith('block1');
        expect(mockMetadataInstance.clear).toHaveBeenCalledWith('block2');
      });
    });

    describe('confirmation status', () => {
      let mockComparingState: any;

      beforeEach(() => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1']);
        mockMetadataInstance.get.mockReturnValue({
          status: 'confirmation',
          quickActionId: 'test-action'
        } as InferenceMetadata);

        mockComparingState = {
          value: 'after',
          setValue: jest.fn()
        };
        mockState.mockReturnValue(mockComparingState);
      });

      it('should initialize comparing state correctly', () => {
        renderFunction(mockBuilderContext);

        expect(mockState).toHaveBeenCalledWith(
          `${expectedPrefix}.comparing`,
          'after'
        );
      });

      describe('cancel button', () => {
        it('should render cancel button when onCancel callback is provided', () => {
          const onCancel = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel,
            onApply: jest.fn(),
            onBefore: jest.fn(),
            onAfter: jest.fn()
          };

          renderFunction(mockBuilderContext);

          expect(mockBuilder.Button).toHaveBeenCalledWith(
            `${expectedPrefix}.cancel`,
            {
              icon: '@imgly/Cross',
              tooltip: `${expectedPrefix}.cancel`,
              onClick: expect.any(Function)
            }
          );
        });

        it('should handle cancel button click correctly', () => {
          const onCancel = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel,
            onApply: jest.fn(),
            onBefore: jest.fn(),
            onAfter: jest.fn()
          };

          renderFunction(mockBuilderContext);

          const cancelButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.cancel`
          );
          const cancelOnClick = cancelButtonCall[1].onClick;

          cancelOnClick();

          // In confirmation status, only onCancel is called, not onCancelGeneration
          expect(onCancel).toHaveBeenCalled();
          expect(mockMetadataInstance.clear).toHaveBeenCalledWith('block1');
        });
      });

      describe('comparison buttons', () => {
        it('should render comparison buttons when both onBefore and onAfter are provided', () => {
          const onBefore = jest.fn();
          const onAfter = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore,
            onAfter,
            onApply: jest.fn()
          };

          renderFunction(mockBuilderContext);

          expect(mockBuilder.ButtonGroup).toHaveBeenCalledWith(
            `${expectedPrefix}.compare`,
            {
              children: expect.any(Function)
            }
          );

          // Execute the children function to test the button creation
          const buttonGroupCall = mockBuilder.ButtonGroup.mock.calls[0];
          const childrenFunction = buttonGroupCall[1].children;
          childrenFunction();

          expect(mockBuilder.Button).toHaveBeenCalledWith(
            `${expectedPrefix}.compare.before`,
            {
              label: `${expectedPrefix}.before`,
              variant: 'regular',
              isActive: false,
              onClick: expect.any(Function)
            }
          );

          expect(mockBuilder.Button).toHaveBeenCalledWith(
            `${expectedPrefix}.compare.after`,
            {
              label: `${expectedPrefix}.after`,
              variant: 'regular',
              isActive: true,
              onClick: expect.any(Function)
            }
          );
        });

        it('should handle before button click correctly', () => {
          const onBefore = jest.fn();
          const onAfter = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore,
            onAfter,
            onApply: jest.fn()
          };

          renderFunction(mockBuilderContext);

          const buttonGroupCall = mockBuilder.ButtonGroup.mock.calls[0];
          const childrenFunction = buttonGroupCall[1].children;
          childrenFunction();

          const beforeButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.compare.before`
          );
          const beforeOnClick = beforeButtonCall[1].onClick;

          beforeOnClick();

          expect(onBefore).toHaveBeenCalled();
          expect(mockComparingState.setValue).toHaveBeenCalledWith('before');
        });

        it('should handle after button click correctly', () => {
          const onBefore = jest.fn();
          const onAfter = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore,
            onAfter,
            onApply: jest.fn()
          };

          renderFunction(mockBuilderContext);

          const buttonGroupCall = mockBuilder.ButtonGroup.mock.calls[0];
          const childrenFunction = buttonGroupCall[1].children;
          childrenFunction();

          const afterButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.compare.after`
          );
          const afterOnClick = afterButtonCall[1].onClick;

          afterOnClick();

          expect(onAfter).toHaveBeenCalled();
          expect(mockComparingState.setValue).toHaveBeenCalledWith('after');
        });

        it('should set correct isActive state based on comparing state', () => {
          mockComparingState.value = 'before';
          const onBefore = jest.fn();
          const onAfter = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore,
            onAfter,
            onApply: jest.fn()
          };

          renderFunction(mockBuilderContext);

          const buttonGroupCall = mockBuilder.ButtonGroup.mock.calls[0];
          const childrenFunction = buttonGroupCall[1].children;
          childrenFunction();

          const beforeButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.compare.before`
          );
          const afterButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.compare.after`
          );

          expect(beforeButtonCall[1].isActive).toBe(true);
          expect(afterButtonCall[1].isActive).toBe(false);
        });
      });

      describe('apply button', () => {
        it('should render apply button when onApply callback is provided', () => {
          const onApply = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore: jest.fn(),
            onAfter: jest.fn(),
            onApply
          };

          renderFunction(mockBuilderContext);

          expect(mockBuilder.Button).toHaveBeenCalledWith(
            `${expectedPrefix}.apply`,
            {
              icon: '@imgly/Checkmark',
              tooltip: `${expectedPrefix}.apply`,
              color: 'accent',
              isDisabled: false,
              onClick: expect.any(Function)
            }
          );
        });

        it('should disable apply button when comparing state is not "after"', () => {
          mockComparingState.value = 'before';
          const onApply = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore: jest.fn(),
            onAfter: jest.fn(),
            onApply
          };

          renderFunction(mockBuilderContext);

          const applyButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.apply`
          );

          expect(applyButtonCall[1].isDisabled).toBe(true);
        });

        it('should enable apply button when comparing state is "after"', () => {
          mockComparingState.value = 'after';
          const onApply = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore: jest.fn(),
            onAfter: jest.fn(),
            onApply
          };

          renderFunction(mockBuilderContext);

          const applyButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.apply`
          );

          expect(applyButtonCall[1].isDisabled).toBe(false);
        });

        it('should handle apply button click correctly', () => {
          const onApply = jest.fn();
          mockBuilderContext.payload!.applyCallbacks = {
            onCancel: jest.fn(),
            onBefore: jest.fn(),
            onAfter: jest.fn(),
            onApply
          };

          renderFunction(mockBuilderContext);

          const applyButtonCall = mockBuilder.Button.mock.calls.find(
            (call: any) => call[0] === `${expectedPrefix}.apply`
          );
          const applyOnClick = applyButtonCall[1].onClick;

          applyOnClick();

          expect(mockMetadataInstance.clear).toHaveBeenCalledWith('block1');
          expect(mockCesdk.engine.editor._update).toHaveBeenCalled();
          expect(onApply).toHaveBeenCalled();
        });
      });
    });

    describe('metadata initialization', () => {
      it('should initialize Metadata with correct parameters', () => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1']);
        mockMetadataInstance.get.mockReturnValue({
          status: 'processing',
          quickActionId: 'test-action'
        });

        renderFunction(mockBuilderContext);

        expect(MockMetadata).toHaveBeenCalledWith(mockEngine, AI_METADATA_KEY);
      });

      it('should get metadata from first selected block', () => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1', 'block2']);
        mockMetadataInstance.get.mockReturnValue({
          status: 'processing',
          quickActionId: 'test-action'
        });

        renderFunction(mockBuilderContext);

        expect(mockMetadataInstance.get).toHaveBeenCalledWith('block1');
      });
    });

    describe('unknown status', () => {
      it('should handle unknown status without errors', () => {
        mockEngine.block.findAllSelected.mockReturnValue(['block1']);
        mockMetadataInstance.get.mockReturnValue({
          status: 'unknown-status' as any,
          quickActionId: 'test-action'
        });

        expect(() => {
          renderFunction(mockBuilderContext);
        }).not.toThrow();

        // Should not render any buttons for unknown status
        expect(mockBuilder.Button).not.toHaveBeenCalled();
        expect(mockBuilder.Separator).not.toHaveBeenCalled();
        expect(mockBuilder.ButtonGroup).not.toHaveBeenCalled();
      });
    });
  });

  describe('different kinds', () => {
    it('should use correct prefix for video kind', async () => {
      const renderFunction = await createConfirmationRenderFunction({
        kind: 'video',
        cesdk: mockCesdk as any
      });
      mockEngine.block.findAllSelected.mockReturnValue(['block1']);
      mockMetadataInstance.get.mockReturnValue({
        status: 'processing',
        quickActionId: 'test-action'
      });

      renderFunction(mockBuilderContext);

      expect(mockBuilder.Button).toHaveBeenCalledWith(
        'ly.img.ai.video.confirmation.spinner',
        expect.any(Object)
      );
    });

    it('should use correct prefix for text kind', async () => {
      const renderFunction = await createConfirmationRenderFunction({
        kind: 'text',
        cesdk: mockCesdk as any
      });
      mockEngine.block.findAllSelected.mockReturnValue(['block1']);
      mockMetadataInstance.get.mockReturnValue({
        status: 'processing',
        quickActionId: 'test-action'
      });

      renderFunction(mockBuilderContext);

      expect(mockBuilder.Button).toHaveBeenCalledWith(
        'ly.img.ai.text.confirmation.spinner',
        expect.any(Object)
      );
    });
  });
});
