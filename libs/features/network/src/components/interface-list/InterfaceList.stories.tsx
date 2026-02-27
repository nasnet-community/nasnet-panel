import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { InterfaceType, InterfaceStatus } from '@nasnet/api-client/generated';
import { GET_INTERFACES, INTERFACE_STATUS_CHANGED } from '@nasnet/api-client/queries';
import { InterfaceList } from './InterfaceList';

const mockInterfaces = [
  {
    id: '*1',
    name: 'ether1',
    type: InterfaceType.Ethernet,
    status: InterfaceStatus.Up,
    enabled: true,
    running: true,
    macAddress: '00:11:22:33:44:55',
    mtu: 1500,
    ip: ['192.168.1.1/24'],
    txBytes: 1000000000,
    rxBytes: 2000000000,
    txRate: 1500000,
    rxRate: 2500000,
    linkSpeed: '1Gbps',
    comment: 'WAN Link',
    usedBy: ['gateway'],
    __typename: 'Interface',
  },
  {
    id: '*2',
    name: 'ether2',
    type: InterfaceType.Ethernet,
    status: InterfaceStatus.Up,
    enabled: true,
    running: true,
    macAddress: '00:11:22:33:44:66',
    mtu: 1500,
    ip: ['10.0.0.1/24'],
    txBytes: 500000000,
    rxBytes: 1000000000,
    txRate: 750000,
    rxRate: 1250000,
    linkSpeed: '1Gbps',
    comment: 'LAN Port',
    usedBy: [],
    __typename: 'Interface',
  },
  {
    id: '*3',
    name: 'bridge1',
    type: InterfaceType.Bridge,
    status: InterfaceStatus.Up,
    enabled: true,
    running: true,
    macAddress: '00:11:22:33:44:77',
    mtu: 1500,
    ip: ['192.168.88.1/24'],
    txBytes: 250000000,
    rxBytes: 500000000,
    txRate: 500000,
    rxRate: 800000,
    linkSpeed: null,
    comment: 'Local Bridge',
    usedBy: ['dhcp-server'],
    __typename: 'Interface',
  },
  {
    id: '*4',
    name: 'ether3',
    type: InterfaceType.Ethernet,
    status: InterfaceStatus.Down,
    enabled: false,
    running: false,
    macAddress: '00:11:22:33:44:88',
    mtu: 1500,
    ip: [],
    txBytes: 0,
    rxBytes: 0,
    txRate: 0,
    rxRate: 0,
    linkSpeed: null,
    comment: null,
    usedBy: [],
    __typename: 'Interface',
  },
  {
    id: '*5',
    name: 'wlan1',
    type: InterfaceType.Wireless,
    status: InterfaceStatus.Up,
    enabled: true,
    running: true,
    macAddress: '00:11:22:33:44:99',
    mtu: 1500,
    ip: [],
    txBytes: 100000000,
    rxBytes: 300000000,
    txRate: 200000,
    rxRate: 400000,
    linkSpeed: '300Mbps',
    comment: '2.4GHz WiFi',
    usedBy: [],
    __typename: 'Interface',
  },
];

const mocks = [
  {
    request: {
      query: GET_INTERFACES,
      variables: { routerId: 'router-1', type: undefined },
    },
    result: {
      data: {
        interfaces: {
          edges: mockInterfaces.map((node) => ({ node, __typename: 'InterfaceEdge' })),
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
            __typename: 'PageInfo',
          },
          totalCount: 5,
          __typename: 'InterfaceConnection',
        },
      },
    },
  },
  {
    request: {
      query: INTERFACE_STATUS_CHANGED,
      variables: { routerId: 'router-1' },
    },
    result: {
      data: {
        interfaceStatusChanged: {
          interfaceId: '*1',
          name: 'ether1',
          status: InterfaceStatus.Up,
          enabled: true,
          running: true,
          __typename: 'InterfaceStatusEvent',
        },
      },
    },
  },
];

type Story = StoryObj<typeof InterfaceList>;

const meta: Meta<typeof InterfaceList> = {
  title: 'Features/Network/InterfaceList',
  component: InterfaceList,
  decorators: [
    (Story) => (
      <MockedProvider mocks={mocks} addTypename={true}>
        <div className="p-component-xl bg-background min-h-screen">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

export const Default: Story = {
  args: {
    routerId: 'router-1',
  },
};

export const Loading: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const loadingMocks = [
        {
          request: {
            query: GET_INTERFACES,
            variables: { routerId: 'router-1', type: undefined },
          },
          result: {
            data: undefined,
          },
          delay: Infinity,
        },
      ];

      return (
        <MockedProvider mocks={loadingMocks} addTypename={true}>
          <div className="p-component-xl bg-background min-h-screen">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
};

export const Empty: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const emptyMocks = [
        {
          request: {
            query: GET_INTERFACES,
            variables: { routerId: 'router-1', type: undefined },
          },
          result: {
            data: {
              interfaces: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                  __typename: 'PageInfo',
                },
                totalCount: 0,
                __typename: 'InterfaceConnection',
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={emptyMocks} addTypename={true}>
          <div className="p-component-xl bg-background min-h-screen">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
};

export const ErrorState: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const errorMocks = [
        {
          request: {
            query: GET_INTERFACES,
            variables: { routerId: 'router-1', type: undefined },
          },
          error: new Error('Failed to fetch interfaces. Connection refused.'),
        },
      ];

      return (
        <MockedProvider mocks={errorMocks} addTypename={true}>
          <div className="p-component-xl bg-background min-h-screen">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
};

export const FilteredByEthernet: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const filteredMocks = [
        {
          request: {
            query: GET_INTERFACES,
            variables: { routerId: 'router-1', type: InterfaceType.Ethernet },
          },
          result: {
            data: {
              interfaces: {
                edges: mockInterfaces
                  .filter((iface) => iface.type === InterfaceType.Ethernet)
                  .map((node) => ({ node, __typename: 'InterfaceEdge' })),
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                  __typename: 'PageInfo',
                },
                totalCount: 3,
                __typename: 'InterfaceConnection',
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={filteredMocks} addTypename={true}>
          <div className="p-component-xl bg-background min-h-screen">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
};

export const WithSelection: Story = {
  args: {
    routerId: 'router-1',
  },
  play: async ({ canvasElement }) => {
    // Auto-select first two interfaces for demonstration
    const canvas = canvasElement;
    const checkboxes = canvas.querySelectorAll('input[type="checkbox"]');

    if (checkboxes[1]) {
      (checkboxes[1] as HTMLInputElement).click();
    }
    if (checkboxes[2]) {
      (checkboxes[2] as HTMLInputElement).click();
    }
  },
};

export const MobileView: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const ManyInterfaces: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      // Generate 50 interfaces for testing virtualization
      const manyInterfaces = Array.from({ length: 50 }, (_, i) => ({
        id: `*${i + 1}`,
        name: `ether${i + 1}`,
        type: i % 3 === 0 ? InterfaceType.Bridge : InterfaceType.Ethernet,
        status: i % 5 === 0 ? InterfaceStatus.Down : InterfaceStatus.Up,
        enabled: i % 5 !== 0,
        running: i % 5 !== 0,
        macAddress: `00:11:22:33:44:${(55 + i).toString(16)}`,
        mtu: 1500,
        ip: i % 2 === 0 ? [`192.168.${i}.1/24`] : [],
        txBytes: Math.floor(Math.random() * 1000000000),
        rxBytes: Math.floor(Math.random() * 2000000000),
        txRate: Math.floor(Math.random() * 1500000),
        rxRate: Math.floor(Math.random() * 2500000),
        linkSpeed: i % 2 === 0 ? '1Gbps' : '100Mbps',
        comment: i % 3 === 0 ? `Port ${i + 1}` : null,
        usedBy: i === 0 ? ['gateway'] : [],
        __typename: 'Interface',
      }));

      const manyMocks = [
        {
          request: {
            query: GET_INTERFACES,
            variables: { routerId: 'router-1', type: undefined },
          },
          result: {
            data: {
              interfaces: {
                edges: manyInterfaces.map((node) => ({ node, __typename: 'InterfaceEdge' })),
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: null,
                  endCursor: null,
                  __typename: 'PageInfo',
                },
                totalCount: 50,
                __typename: 'InterfaceConnection',
              },
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={manyMocks} addTypename={true}>
          <div className="p-component-xl bg-background min-h-screen">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
};

export const DarkMode: Story = {
  args: {
    routerId: 'router-1',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mocks} addTypename={true}>
        <div className="p-component-xl bg-background min-h-screen dark">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};
