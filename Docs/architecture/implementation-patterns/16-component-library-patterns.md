# 16. Component Library Patterns

## Three-Layer Component Architecture

```
Layer 1: Primitives (shadcn/ui + Radix)
   ↓ provides base accessibility, styling, behavior
Layer 2: Patterns (56 components)
   ↓ provides consistent UX across features
Layer 3: Domain Components (feature-specific)
   ↓ provides specialized functionality
```

## Headless + Platform Presenters

Write behavior once, render optimally on Mobile/Tablet/Desktop.

```tsx
// Headless hook (behavior)
function useResourceCard<T extends Resource>(props: { resource: T }) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: update } = useUpdateResource();

  return {
    resource: props.resource,
    expanded,
    toggle: () => setExpanded(!expanded),
    actions: {
      onEdit: () => update(props.resource),
      onDelete: () => deleteResource(props.resource.uuid),
    },
  };
}

// Platform presenters (presentation)
const ResourceCard = <T extends Resource>({ resource }: ResourceCardProps<T>) => {
  const state = useResourceCard({ resource });
  const { platform } = usePlatform();

  switch (platform) {
    case 'mobile': return <ResourceCardMobile {...state} />;
    case 'tablet': return <ResourceCardTablet {...state} />;
    default: return <ResourceCardDesktop {...state} />;
  }
};

// Automatic detection (95% of cases)
<ResourceCard<VPNClient> resource={vpn} />

// Manual override (special cases)
<ResourceCard<VPNClient> resource={vpn} presenter="desktop" />
```

## Three-Tier Token System

```typescript
type Theme = {
  // Tier 1: Primitives (~80 tokens)
  primitive: {
    colors: {
      blue: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
      red: { 50: '#fef2f2', 500: '#ef4444', 900: '#7f1d1d' },
    },
    spacing: { 0: '0', 1: '0.25rem', 4: '1rem', 16: '4rem' },
    fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem' },
    borderRadius: { sm: '0.125rem', md: '0.375rem', lg: '0.5rem' },
  },

  // Tier 2: Semantic (~70 tokens)
  semantic: {
    colorPrimary: 'primitive.blue.500',
    colorSuccess: 'primitive.green.500',
    colorWarning: 'primitive.yellow.500',
    colorDanger: 'primitive.red.500',
    colorCategorySecurity: 'primitive.red.600',
    colorCategoryMonitoring: 'primitive.purple.500',
  },

  // Tier 3: Component (~50 tokens)
  component: {
    buttonBgPrimary: 'semantic.colorPrimary',
    buttonTextPrimary: 'primitive.white',
    cardPadding: 'semantic.spacingComponentMd',
    cardBorderRadius: 'primitive.borderRadius.lg',
  }
};
```

## Form Schema Generation with Field Modes

Four field modes solve all form scenarios:

```typescript
type FieldMode = 'editable' | 'readonly' | 'hidden' | 'computed';

interface FormFieldConfig {
  name: string;
  mode: FieldMode;
  source?: 'user' | 'system' | 'derived';
  validation?: ZodSchema;
}

// Generate form from schema with modes
const vpnFormConfig: FormFieldConfig[] = [
  { name: 'name', mode: 'editable', validation: z.string().min(1) },
  { name: 'listenPort', mode: 'editable', validation: z.number().min(1).max(65535) },
  { name: 'privateKey', mode: 'readonly', source: 'system' },  // Auto-generated
  { name: 'publicKey', mode: 'computed', source: 'derived' },  // Derived from private
  { name: 'internalId', mode: 'hidden', source: 'system' },    // Router's ID
];
```

## Marketplace Shadow DOM Isolation

```tsx
// Marketplace features run in Shadow DOM (perfect CSS isolation)
function MarketplaceFeatureContainer({ feature }: { feature: Feature }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shadow = containerRef.current?.attachShadow({ mode: 'open' });
    if (shadow) {
      // Inject theme contract CSS variables (optional integration)
      const themeStyles = document.createElement('style');
      themeStyles.textContent = getThemeContractCSS();
      shadow.appendChild(themeStyles);

      // Render feature content
      ReactDOM.render(<FeatureUI />, shadow);
    }
  }, []);

  return <div ref={containerRef} />;
}
```

---
