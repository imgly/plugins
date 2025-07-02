import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  ActionRegistry,
  PluginActionDefinition,
  QuickActionDefinition,
  ActionRegistrySubscriberCallback
} from '../ActionRegistry';

describe('ActionRegistry', () => {
  let registry: ActionRegistry;

  beforeEach(() => {
    // Reset global singleton instance for each test
    const globalObj = (
      typeof window !== 'undefined' ? window : globalThis
    ) as any;
    delete globalObj.__imgly_action_registry__;
    registry = ActionRegistry.get();
  });

  describe('singleton behavior', () => {
    it('should return the same instance when called multiple times', () => {
      const registry1 = ActionRegistry.get();
      const registry2 = ActionRegistry.get();

      expect(registry1).toBe(registry2);
    });

    it('should maintain state across multiple get() calls', () => {
      const action: PluginActionDefinition = {
        type: 'plugin',
        id: 'test-action',
        label: 'Test Action',
        description: 'A test action',
        pluginId: 'test-plugin',
        execute: jest.fn()
      };

      registry.register(action);
      const newRegistryReference = ActionRegistry.get();

      expect(newRegistryReference.getAll()).toHaveLength(1);
      expect(newRegistryReference.getAll()[0]).toBe(action);
    });
  });

  describe('register', () => {
    it('should register a plugin action', () => {
      const action: PluginActionDefinition = {
        type: 'plugin',
        id: 'test-plugin-action',
        label: 'Test Plugin Action',
        description: 'A test plugin action',
        pluginId: 'test-plugin',
        execute: jest.fn()
      };

      const dispose = registry.register(action);

      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getAll()[0]).toBe(action);
      expect(typeof dispose).toBe('function');
    });

    it('should register a quick action', () => {
      const action: QuickActionDefinition = {
        type: 'quick',
        id: 'test-quick-action',
        label: 'Test Quick Action',
        description: 'A test quick action',
        pluginId: 'test-plugin',
        kind: 'image',
        enable: true,
        render: jest.fn()
      };

      const dispose = registry.register(action);

      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getAll()[0]).toBe(action);
      expect(typeof dispose).toBe('function');
    });

    it('should allow overriding actions with the same id', () => {
      const action1: PluginActionDefinition = {
        type: 'plugin',
        id: 'same-id',
        label: 'First Action',
        description: 'First action',
        pluginId: 'plugin-1',
        execute: jest.fn()
      };

      const action2: PluginActionDefinition = {
        type: 'plugin',
        id: 'same-id',
        label: 'Second Action',
        description: 'Second action',
        pluginId: 'plugin-2',
        execute: jest.fn()
      };

      registry.register(action1);
      registry.register(action2);

      const actions = registry.getAll();
      expect(actions).toHaveLength(1);
      expect(actions[0]).toBe(action2);
      expect(actions[0].label).toBe('Second Action');
    });

    it('should return a disposer function that removes the action', () => {
      const action: PluginActionDefinition = {
        type: 'plugin',
        id: 'disposable-action',
        label: 'Disposable Action',
        description: 'An action that can be disposed',
        pluginId: 'test-plugin',
        execute: jest.fn()
      };

      const dispose = registry.register(action);
      expect(registry.getAll()).toHaveLength(1);

      dispose();
      expect(registry.getAll()).toHaveLength(0);
    });

    it('should handle disposer safely when action is overridden', () => {
      const action1: PluginActionDefinition = {
        type: 'plugin',
        id: 'override-test',
        label: 'First Action',
        description: 'First action',
        pluginId: 'plugin-1',
        execute: jest.fn()
      };

      const action2: PluginActionDefinition = {
        type: 'plugin',
        id: 'override-test',
        label: 'Second Action',
        description: 'Second action',
        pluginId: 'plugin-2',
        execute: jest.fn()
      };

      const dispose1 = registry.register(action1);
      const dispose2 = registry.register(action2);

      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getAll()[0]).toBe(action2);

      // dispose1 should be a no-op since action1 was overridden
      dispose1();
      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getAll()[0]).toBe(action2);

      // dispose2 should actually remove the action
      dispose2();
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    it('should return an empty array when no actions are registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('should return all registered actions', () => {
      const pluginAction: PluginActionDefinition = {
        type: 'plugin',
        id: 'plugin-action',
        label: 'Plugin Action',
        description: 'A plugin action',
        pluginId: 'test-plugin',
        execute: jest.fn()
      };

      const quickAction: QuickActionDefinition = {
        type: 'quick',
        id: 'quick-action',
        label: 'Quick Action',
        description: 'A quick action',
        pluginId: 'test-plugin',
        kind: 'image',
        enable: true,
        render: jest.fn()
      };

      registry.register(pluginAction);
      registry.register(quickAction);

      const actions = registry.getAll();
      expect(actions).toHaveLength(2);
      expect(actions).toContain(pluginAction);
      expect(actions).toContain(quickAction);
    });
  });

  describe('getBy', () => {
    let pluginAction1: PluginActionDefinition;
    let pluginAction2: PluginActionDefinition;
    let quickAction1: QuickActionDefinition;
    let quickAction2: QuickActionDefinition;

    beforeEach(() => {
      pluginAction1 = {
        type: 'plugin',
        id: 'plugin-action-1',
        label: 'Plugin Action 1',
        description: 'First plugin action',
        pluginId: 'plugin-a',
        execute: jest.fn()
      };

      pluginAction2 = {
        type: 'plugin',
        id: 'plugin-action-2',
        label: 'Plugin Action 2',
        description: 'Second plugin action',
        pluginId: 'plugin-b',
        execute: jest.fn()
      };

      quickAction1 = {
        type: 'quick',
        id: 'quick-action-1',
        label: 'Quick Action 1',
        description: 'First quick action',
        pluginId: 'plugin-a',
        kind: 'image',
        enable: true,
        render: jest.fn()
      };

      quickAction2 = {
        type: 'quick',
        id: 'quick-action-2',
        label: 'Quick Action 2',
        description: 'Second quick action',
        pluginId: 'plugin-b',
        kind: 'text',
        enable: true,
        render: jest.fn()
      };

      registry.register(pluginAction1);
      registry.register(pluginAction2);
      registry.register(quickAction1);
      registry.register(quickAction2);
    });

    it('should filter by type and return correctly typed results', () => {
      const pluginActions = registry.getBy({ type: 'plugin' });
      const quickActions = registry.getBy({ type: 'quick' });

      expect(pluginActions).toHaveLength(2);
      expect(quickActions).toHaveLength(2);

      // Type assertions to verify TypeScript typing
      pluginActions.forEach((action) => {
        expect(action.type).toBe('plugin');
        // This should compile without TypeScript errors
        action.execute();
      });

      quickActions.forEach((action) => {
        expect(action.type).toBe('quick');
        // This should compile without TypeScript errors
        expect(typeof action.render).toBe('function');
      });
    });

    it('should filter by pluginId', () => {
      const pluginAActions = registry.getBy({ pluginId: 'plugin-a' });
      const pluginBActions = registry.getBy({ pluginId: 'plugin-b' });

      expect(pluginAActions).toHaveLength(2);
      expect(pluginBActions).toHaveLength(2);

      expect(pluginAActions).toContain(pluginAction1);
      expect(pluginAActions).toContain(quickAction1);
      expect(pluginBActions).toContain(pluginAction2);
      expect(pluginBActions).toContain(quickAction2);
    });

    it('should filter by id', () => {
      const specificAction = registry.getBy({ id: 'plugin-action-1' });

      expect(specificAction).toHaveLength(1);
      expect(specificAction[0]).toBe(pluginAction1);
    });

    it('should combine multiple filters', () => {
      const combinedFilter = registry.getBy({
        type: 'plugin',
        pluginId: 'plugin-a'
      });

      expect(combinedFilter).toHaveLength(1);
      expect(combinedFilter[0]).toBe(pluginAction1);
      expect(combinedFilter[0].type).toBe('plugin');
      expect(combinedFilter[0].pluginId).toBe('plugin-a');
    });

    it('should return empty array when no actions match filters', () => {
      const noMatch = registry.getBy({ pluginId: 'non-existent-plugin' });
      expect(noMatch).toEqual([]);
    });

    it('should return all actions when no filters are provided', () => {
      const allActions = registry.getBy({});
      expect(allActions).toHaveLength(4);
      expect(allActions).toContain(pluginAction1);
      expect(allActions).toContain(pluginAction2);
      expect(allActions).toContain(quickAction1);
      expect(allActions).toContain(quickAction2);
    });

    it('should handle complex filter combinations', () => {
      const complexFilter = registry.getBy({
        type: 'quick',
        pluginId: 'plugin-b',
        id: 'quick-action-2'
      });

      expect(complexFilter).toHaveLength(1);
      expect(complexFilter[0]).toBe(quickAction2);
    });

    it('should filter by kind for quick actions', () => {
      const imageActions = registry.getBy({ kind: 'image' });
      const textActions = registry.getBy({ kind: 'text' });

      expect(imageActions).toHaveLength(1);
      expect(imageActions[0]).toBe(quickAction1);
      expect((imageActions[0] as QuickActionDefinition).kind).toBe('image');

      expect(textActions).toHaveLength(1);
      expect(textActions[0]).toBe(quickAction2);
      expect((textActions[0] as QuickActionDefinition).kind).toBe('text');
    });

    it('should combine type and kind filters', () => {
      const quickImageActions = registry.getBy({
        type: 'quick',
        kind: 'image'
      });

      expect(quickImageActions).toHaveLength(1);
      expect(quickImageActions[0]).toBe(quickAction1);
      expect(quickImageActions[0].type).toBe('quick');
      expect(quickImageActions[0].kind).toBe('image');
    });

    it('should return empty array for non-existent kind', () => {
      const videoActions = registry.getBy({ kind: 'video' });
      expect(videoActions).toEqual([]);
    });

    it('should filter out plugin actions when kind filter is specified', () => {
      // Kind filter should exclude plugin actions since they don't have a kind property
      const pluginActionsWithKind = registry.getBy({
        type: 'plugin',
        kind: 'image'
      });

      expect(pluginActionsWithKind).toHaveLength(0);
    });

    it('should combine all filters including kind', () => {
      const specificQuickAction = registry.getBy({
        type: 'quick',
        pluginId: 'plugin-a',
        kind: 'image'
      });

      expect(specificQuickAction).toHaveLength(1);
      expect(specificQuickAction[0]).toBe(quickAction1);
      expect(specificQuickAction[0].type).toBe('quick');
      expect(specificQuickAction[0].pluginId).toBe('plugin-a');
      expect(specificQuickAction[0].kind).toBe('image');
    });
  });

  describe('subscriptions', () => {
    let mockCallback: jest.MockedFunction<ActionRegistrySubscriberCallback>;
    let pluginAction: PluginActionDefinition;
    let quickAction: QuickActionDefinition;

    beforeEach(() => {
      mockCallback = jest.fn();
      pluginAction = {
        type: 'plugin',
        id: 'test-plugin-action',
        label: 'Test Plugin Action',
        description: 'A test plugin action',
        pluginId: 'test-plugin',
        execute: jest.fn()
      };
      quickAction = {
        type: 'quick',
        id: 'test-quick-action',
        label: 'Test Quick Action',
        description: 'A test quick action',
        pluginId: 'test-plugin',
        kind: 'image',
        enable: true,
        render: jest.fn()
      };
    });

    describe('subscribe', () => {
      it('should notify subscriber when action is registered', () => {
        const unsubscribe = registry.subscribe(mockCallback);

        registry.register(pluginAction);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'registered');

        unsubscribe();
      });

      it('should notify subscriber when action is unregistered', () => {
        const unsubscribe = registry.subscribe(mockCallback);
        const dispose = registry.register(pluginAction);

        // Clear the registration call
        mockCallback.mockClear();

        dispose();

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'unregistered');

        unsubscribe();
      });

      it('should notify multiple subscribers', () => {
        const mockCallback2 = jest.fn();
        const unsubscribe1 = registry.subscribe(mockCallback);
        const unsubscribe2 = registry.subscribe(mockCallback2);

        registry.register(pluginAction);

        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'registered');
        expect(mockCallback2).toHaveBeenCalledWith(pluginAction, 'registered');

        unsubscribe1();
        unsubscribe2();
      });

      it('should stop notifying after unsubscribe', () => {
        const unsubscribe = registry.subscribe(mockCallback);

        registry.register(pluginAction);
        expect(mockCallback).toHaveBeenCalledTimes(1);

        unsubscribe();
        mockCallback.mockClear();

        registry.register(quickAction);
        expect(mockCallback).not.toHaveBeenCalled();
      });

      it('should handle multiple unsubscribe calls safely', () => {
        const unsubscribe = registry.subscribe(mockCallback);

        unsubscribe();
        expect(() => unsubscribe()).not.toThrow();
      });
    });

    describe('subscribeBy', () => {
      it('should only notify for actions matching type filter', () => {
        const unsubscribe = registry.subscribeBy(
          { type: 'plugin' },
          mockCallback
        );

        registry.register(pluginAction);
        registry.register(quickAction);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'registered');

        unsubscribe();
      });

      it('should only notify for actions matching pluginId filter', () => {
        const otherPluginAction: PluginActionDefinition = {
          ...pluginAction,
          id: 'other-action',
          pluginId: 'other-plugin'
        };

        const unsubscribe = registry.subscribeBy(
          { pluginId: 'test-plugin' },
          mockCallback
        );

        registry.register(pluginAction);
        registry.register(otherPluginAction);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'registered');

        unsubscribe();
      });

      it('should only notify for actions matching id filter', () => {
        const unsubscribe = registry.subscribeBy(
          { id: 'test-plugin-action' },
          mockCallback
        );

        registry.register(pluginAction);
        registry.register(quickAction);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'registered');

        unsubscribe();
      });

      it('should handle combined filters', () => {
        const unsubscribe = registry.subscribeBy(
          {
            type: 'plugin',
            pluginId: 'test-plugin'
          },
          mockCallback
        );

        registry.register(pluginAction);
        registry.register(quickAction); // Different type

        const otherPluginAction: PluginActionDefinition = {
          ...pluginAction,
          id: 'other-action',
          pluginId: 'other-plugin' // Different pluginId
        };
        registry.register(otherPluginAction);

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'registered');

        unsubscribe();
      });

      it('should notify on unregistration for matching actions', () => {
        const unsubscribe = registry.subscribeBy(
          { type: 'plugin' },
          mockCallback
        );
        const dispose = registry.register(pluginAction);

        // Clear registration call
        mockCallback.mockClear();

        dispose();

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(pluginAction, 'unregistered');

        unsubscribe();
      });

      it('should not notify when filters do not match', () => {
        const unsubscribe = registry.subscribeBy(
          { type: 'quick' },
          mockCallback
        );

        registry.register(pluginAction); // Type mismatch

        expect(mockCallback).not.toHaveBeenCalled();

        unsubscribe();
      });

      it('should handle empty filters (matches all)', () => {
        const unsubscribe = registry.subscribeBy({}, mockCallback);

        registry.register(pluginAction);
        registry.register(quickAction);

        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenNthCalledWith(
          1,
          pluginAction,
          'registered'
        );
        expect(mockCallback).toHaveBeenNthCalledWith(
          2,
          quickAction,
          'registered'
        );

        unsubscribe();
      });
    });

    describe('mixed subscriptions', () => {
      it('should handle both subscribe and subscribeBy together', () => {
        const generalCallback = jest.fn();
        const specificCallback = jest.fn();

        const unsubscribeGeneral = registry.subscribe(generalCallback);
        const unsubscribeSpecific = registry.subscribeBy(
          { type: 'plugin' },
          specificCallback
        );

        registry.register(pluginAction);
        registry.register(quickAction);

        // General callback should be called for both
        expect(generalCallback).toHaveBeenCalledTimes(2);
        expect(generalCallback).toHaveBeenNthCalledWith(
          1,
          pluginAction,
          'registered'
        );
        expect(generalCallback).toHaveBeenNthCalledWith(
          2,
          quickAction,
          'registered'
        );

        // Specific callback should only be called for plugin action
        expect(specificCallback).toHaveBeenCalledTimes(1);
        expect(specificCallback).toHaveBeenCalledWith(
          pluginAction,
          'registered'
        );

        unsubscribeGeneral();
        unsubscribeSpecific();
      });

      it('should not affect other subscribers when one unsubscribes', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        const unsubscribe1 = registry.subscribe(callback1);
        const unsubscribe2 = registry.subscribeBy(
          { type: 'plugin' },
          callback2
        );

        registry.register(pluginAction);

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);

        // Unsubscribe first callback
        unsubscribe1();
        callback1.mockClear();
        callback2.mockClear();

        registry.register(quickAction);

        // First callback should not be called
        expect(callback1).not.toHaveBeenCalled();
        // Second callback should not be called (type mismatch)
        expect(callback2).not.toHaveBeenCalled();

        unsubscribe2();
      });
    });
  });
});
