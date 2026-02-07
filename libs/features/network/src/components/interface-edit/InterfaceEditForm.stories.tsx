import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { InterfaceEditForm } from './InterfaceEditForm';
import { UPDATE_INTERFACE } from '@nasnet/api-client/queries';

const mockInterface = {
  id: '*1',
  name: 'ether1',
  type: 'ETHERNET',
  status: 'UP',
  enabled: true,
  running: true,
  mtu: 1500,
  comment: 'WAN Link',
};

const successMocks = [
  {
    request: {
      query: UPDATE_INTERFACE,
      variables: {
        routerId: 'router-1',
        interfaceId: '*1',
        input: {
          enabled: true,
          mtu: 1500,
          comment: 'WAN Link',
        },
      },
    },
    result: {
      data: {
        updateInterface: {
          interface: {
            id: '*1',
            name: 'ether1',
            enabled: true,
            mtu: 1500,
            comment: 'WAN Link',
            __typename: 'Interface',
          },
          errors: [],
          __typename: 'UpdateInterfacePayload',
        },
      },
    },
  },
];

const meta: Meta<typeof InterfaceEditForm> = {
  title: 'Features/Network/InterfaceEditForm',
  component: InterfaceEditForm,
  decorators: [
    (Story) => (
      <MockedProvider mocks={successMocks} addTypename={true}>
        <div className="p-8 bg-background max-w-xl">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InterfaceEditForm>;

export const Default: Story = {
  args: {
    routerId: 'router-1',
    interface: mockInterface,
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
};

export const Disabled: Story = {
  args: {
    routerId: 'router-1',
    interface: {
      ...mockInterface,
      enabled: false,
    },
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
};

export const NoComment: Story = {
  args: {
    routerId: 'router-1',
    interface: {
      ...mockInterface,
      comment: null,
    },
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
};

export const CustomMTU: Story = {
  args: {
    routerId: 'router-1',
    interface: {
      ...mockInterface,
      mtu: 9000,
      comment: 'Jumbo frames enabled',
    },
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
};

export const Loading: Story = {
  args: {
    routerId: 'router-1',
    interface: mockInterface,
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
  decorators: [
    (Story) => {
      const loadingMocks = [
        {
          request: {
            query: UPDATE_INTERFACE,
            variables: {
              routerId: 'router-1',
              interfaceId: '*1',
              input: {
                enabled: true,
                mtu: 1500,
                comment: 'WAN Link',
              },
            },
          },
          result: {
            data: undefined,
          },
          delay: Infinity,
        },
      ];

      return (
        <MockedProvider mocks={loadingMocks} addTypename={true}>
          <div className="p-8 bg-background max-w-xl">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const submitButton = canvas.querySelector('button[type="submit"]');
    if (submitButton) {
      (submitButton as HTMLButtonElement).click();
    }
  },
};

export const ValidationError: Story = {
  args: {
    routerId: 'router-1',
    interface: mockInterface,
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;

    // Set invalid MTU
    const mtuInput = canvas.querySelector('input[type="number"]');
    if (mtuInput) {
      (mtuInput as HTMLInputElement).value = '50';
      mtuInput.dispatchEvent(new Event('input', { bubbles: true }));
      mtuInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Submit to trigger validation
    const submitButton = canvas.querySelector('button[type="submit"]');
    if (submitButton) {
      (submitButton as HTMLButtonElement).click();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates client-side validation with invalid MTU value (minimum is 68).',
      },
    },
  },
};

export const ServerError: Story = {
  args: {
    routerId: 'router-1',
    interface: mockInterface,
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
  decorators: [
    (Story) => {
      const errorMocks = [
        {
          request: {
            query: UPDATE_INTERFACE,
            variables: {
              routerId: 'router-1',
              interfaceId: '*1',
              input: {
                enabled: true,
                mtu: 1500,
                comment: 'WAN Link',
              },
            },
          },
          result: {
            data: {
              updateInterface: {
                interface: null,
                errors: [
                  {
                    code: 'INVALID_MTU',
                    message: 'MTU value not supported by this interface type',
                    field: 'mtu',
                    __typename: 'MutationError',
                  },
                ],
                __typename: 'UpdateInterfacePayload',
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={errorMocks} addTypename={true}>
          <div className="p-8 bg-background max-w-xl">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const submitButton = canvas.querySelector('button[type="submit"]');
    if (submitButton) {
      (submitButton as HTMLButtonElement).click();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates server-side validation error handling.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    routerId: 'router-1',
    interface: mockInterface,
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={successMocks} addTypename={true}>
        <div className="p-8 bg-background max-w-xl dark">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const MobileView: Story = {
  args: {
    routerId: 'router-1',
    interface: mockInterface,
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const LongComment: Story = {
  args: {
    routerId: 'router-1',
    interface: {
      ...mockInterface,
      comment: 'This is a very long comment that demonstrates how the form handles text wrapping and display of lengthy interface descriptions. Maximum length is 255 characters.',
    },
    onSuccess: () => console.log('Success!'),
    onCancel: () => console.log('Cancelled'),
  },
};
