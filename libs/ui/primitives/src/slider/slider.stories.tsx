import * as React from 'react';

import { Slider } from './slider';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An input where the user selects a value from within a given range, built on Radix UI Slider. Features a primary-colored filled range track, a circular thumb with a 2px primary border, and full keyboard support (arrow keys, Home, End). Supports single-value and range (multi-thumb) modes via the `defaultValue` array length.',
      },
    },
  },
  argTypes: {
    min: {
      control: { type: 'number' },
      description: 'The minimum value of the slider.',
    },
    max: {
      control: { type: 'number' },
      description: 'The maximum value of the slider.',
    },
    step: {
      control: { type: 'number', min: 1 },
      description: 'The step increment between values.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the slider.',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the slider.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export const WithLabel: Story = {
  render: function SliderWithLabel() {
    const [value, setValue] = React.useState([75]);
    return (
      <div className="flex flex-col gap-3 w-72">
        <div className="flex justify-between items-center">
          <label htmlFor="slider-max-tx-rate" className="text-sm font-medium text-foreground">
            Max TX Rate
          </label>
          <span className="text-sm font-mono text-primary">{value[0]} Mbps</span>
        </div>
        <Slider
          id="slider-max-tx-rate"
          value={value}
          onValueChange={setValue}
          min={1}
          max={1000}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 Mbps</span>
          <span>1000 Mbps</span>
        </div>
      </div>
    );
  },
};

export const SteppedValues: Story = {
  render: function SteppedSlider() {
    const [value, setValue] = React.useState([5]);
    const steps = [1, 2, 5, 10, 30, 60];
    return (
      <div className="flex flex-col gap-3 w-72">
        <div className="flex justify-between items-center">
          <label htmlFor="slider-keepalive" className="text-sm font-medium text-foreground">
            Keepalive Interval
          </label>
          <span className="text-sm font-mono text-primary">{value[0]}s</span>
        </div>
        <Slider
          id="slider-keepalive"
          value={value}
          onValueChange={setValue}
          min={1}
          max={60}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((s) => (
            <span key={s}>{s}s</span>
          ))}
        </div>
      </div>
    );
  },
};

export const RangeSlider: Story = {
  render: function RangeSliderExample() {
    const [range, setRange] = React.useState([1024, 49151]);
    return (
      <div className="flex flex-col gap-3 w-80">
        <div className="flex justify-between items-center">
          <label htmlFor="slider-port-range" className="text-sm font-medium text-foreground">
            Allowed Port Range
          </label>
          <span className="text-sm font-mono text-primary">
            {range[0]}–{range[1]}
          </span>
        </div>
        <Slider
          id="slider-port-range"
          value={range}
          onValueChange={setRange}
          min={1}
          max={65535}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Port 1</span>
          <span>Port 65535</span>
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [40],
    min: 0,
    max: 100,
    disabled: true,
    id: 'slider-cpu-limit',
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-3 w-72">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground opacity-50">
            CPU Limit (managed by policy)
          </span>
          <span className="text-sm font-mono text-muted-foreground">40%</span>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const AllScenarios: Story = {
  render: function AllSlidersExample() {
    const [txRate, setTxRate] = React.useState([250]);
    const [rxRate, setRxRate] = React.useState([500]);
    const [pingInterval, setPingInterval] = React.useState([10]);

    return (
      <div className="flex flex-col gap-6 w-80">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Upload Limit</span>
            <span className="text-sm font-mono text-primary">{txRate[0]} Mbps</span>
          </div>
          <Slider value={txRate} onValueChange={setTxRate} min={1} max={1000} step={1} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Download Limit</span>
            <span className="text-sm font-mono text-primary">{rxRate[0]} Mbps</span>
          </div>
          <Slider value={rxRate} onValueChange={setRxRate} min={1} max={1000} step={1} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Ping Interval</span>
            <span className="text-sm font-mono text-primary">{pingInterval[0]}s</span>
          </div>
          <Slider value={pingInterval} onValueChange={setPingInterval} min={1} max={60} step={1} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground opacity-50">
              Max Connections (system-managed)
            </span>
            <span className="text-sm font-mono text-muted-foreground">100</span>
          </div>
          <Slider defaultValue={[100]} min={0} max={200} disabled />
        </div>
      </div>
    );
  },
};
