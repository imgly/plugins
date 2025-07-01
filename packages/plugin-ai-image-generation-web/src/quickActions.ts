import { QuickActionDefinition } from '@imgly/plugin-ai-generation-web/dist/ActionRegistry';

function quickActions(): QuickActionDefinition[] {
  return [
    {
      kind: 'image',
      type: 'quick',
      id: 'test-quick-action',
      pluginId: 'ai-image-generation',
      label: 'Test Quick Action',
      description: 'This is a test quick action.',
      enable: true,
      execute: () => {
        console.log('Quick action executed!');
      },
      render: ({ builder, state, isExpanded, toggleExpand }) => {
        if (isExpanded) {
          builder.TextArea('expanded', {
            inputLabel: 'Expanded Quick Action',
            ...state('expandedText', '')
          });
          builder.Button('expanded.button', {
            label: 'back',
            onClick: toggleExpand
          });
        } else {
          builder.Button('xxx', {
            label: 'Test Quick Action',
            onClick: toggleExpand
          });
        }
      }
    },
    {
      kind: 'image',
      type: 'quick',
      id: 'test-quick-action-second',
      pluginId: 'ai-image-generation',
      label: 'Test Quick Action',
      description: 'This is a test quick action.',
      enable: true,
      execute: () => {
        console.log('Quick action executed!');
      },
      render: ({ builder, state, isExpanded, toggleExpand }) => {
        if (isExpanded) {
          builder.TextArea('expanded.second', {
            inputLabel: 'Expanded Quick Action',
            ...state('expandedText', '')
          });
          builder.Button('expanded.second.button', {
            label: 'back',
            onClick: toggleExpand
          });
        } else {
          builder.Button('xxx.second', {
            label: 'Test Quick Action',
            onClick: toggleExpand
          });
        }
      }
    }
  ];
}

export default quickActions;
