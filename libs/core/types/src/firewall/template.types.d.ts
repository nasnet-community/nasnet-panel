/**
 * Firewall Template Types and Schemas
 *
 * Type definitions and Zod schemas for firewall templates, including
 * template variables, rules, conflicts, and preview results.
 *
 * @see NAS-7.6: Firewall Templates Feature
 */
import { z } from 'zod';
/**
 * Variable types supported in templates
 * Different variable types for template parameterization
 */
export declare const VariableTypeSchema: z.ZodEnum<
  ['INTERFACE', 'SUBNET', 'IP', 'PORT', 'PORT_RANGE', 'VLAN_ID', 'STRING', 'NUMBER', 'BOOLEAN']
>;
/**
 * Type for template variable types
 * @example
 * const varType: VariableType = 'IP';
 */
export type VariableType = z.infer<typeof VariableTypeSchema>;
/**
 * Template categories
 * Organizes templates by use case or network context
 */
export declare const TemplateCategorySchema: z.ZodEnum<
  ['BASIC', 'HOME', 'GAMING', 'IOT', 'GUEST', 'VPN', 'SECURITY', 'CUSTOM']
>;
/**
 * Type for template category
 * @example
 * const category: TemplateCategory = 'SECURITY';
 */
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;
/**
 * Template complexity levels
 * Indicates the sophistication and difficulty of a template
 */
export declare const TemplateComplexitySchema: z.ZodEnum<
  ['SIMPLE', 'MODERATE', 'ADVANCED', 'EXPERT']
>;
/**
 * Type for template complexity level
 * @example
 * const complexity: TemplateComplexity = 'ADVANCED';
 */
export type TemplateComplexity = z.infer<typeof TemplateComplexitySchema>;
/**
 * Firewall table types
 * Different MikroTik firewall tables where rules can be applied
 */
export declare const FirewallTableSchema: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
/**
 * Type for firewall table
 * @example
 * const table: FirewallTable = 'FILTER';
 */
export type FirewallTable = z.infer<typeof FirewallTableSchema>;
/**
 * Template conflict types for template preview
 * Indicates what kind of conflict was detected with existing rules
 */
export declare const TemplateConflictTypeSchema: z.ZodEnum<
  ['DUPLICATE_RULE', 'IP_OVERLAP', 'CHAIN_CONFLICT', 'POSITION_CONFLICT', 'PORT_CONFLICT']
>;
/**
 * Type for template conflict type
 * @example
 * const conflictType: TemplateConflictType = 'DUPLICATE_RULE';
 */
export type TemplateConflictType = z.infer<typeof TemplateConflictTypeSchema>;
/**
 * Template variable definition
 * Defines a parameterizable variable within a template that can be substituted
 * at template application time
 */
export declare const TemplateVariableSchema: z.ZodObject<
  {
    name: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<
      ['INTERFACE', 'SUBNET', 'IP', 'PORT', 'PORT_RANGE', 'VLAN_ID', 'STRING', 'NUMBER', 'BOOLEAN']
    >;
    defaultValue: z.ZodOptional<z.ZodString>;
    isRequired: z.ZodBoolean;
    description: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    label: string;
    name: string;
    type:
      | 'PORT'
      | 'INTERFACE'
      | 'SUBNET'
      | 'IP'
      | 'PORT_RANGE'
      | 'VLAN_ID'
      | 'STRING'
      | 'NUMBER'
      | 'BOOLEAN';
    isRequired: boolean;
    defaultValue?: string | undefined;
    description?: string | undefined;
    options?: string[] | undefined;
  },
  {
    label: string;
    name: string;
    type:
      | 'PORT'
      | 'INTERFACE'
      | 'SUBNET'
      | 'IP'
      | 'PORT_RANGE'
      | 'VLAN_ID'
      | 'STRING'
      | 'NUMBER'
      | 'BOOLEAN';
    isRequired: boolean;
    defaultValue?: string | undefined;
    description?: string | undefined;
    options?: string[] | undefined;
  }
>;
/**
 * Type for a template variable definition
 * @example
 * const variable: TemplateVariable = { name: 'LAN_INTERFACE', label: 'LAN Interface', ... };
 */
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
/**
 * Template rule definition
 * Represents a single firewall rule within a template with optional variable substitution
 * Properties field stores rule-specific MikroTik attributes (e.g., src-address, dst-port)
 */
export declare const TemplateRuleSchema: z.ZodObject<
  {
    table: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
    chain: z.ZodString;
    action: z.ZodString;
    comment: z.ZodOptional<z.ZodString>;
    position: z.ZodNullable<z.ZodNumber>;
    properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
  },
  'strip',
  z.ZodTypeAny,
  {
    table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
    action: string;
    position: number | null;
    chain: string;
    properties: Record<string, unknown>;
    comment?: string | undefined;
  },
  {
    table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
    action: string;
    position: number | null;
    chain: string;
    properties: Record<string, unknown>;
    comment?: string | undefined;
  }
>;
/**
 * Type for a template rule definition
 * @example
 * const rule: TemplateRule = { table: 'FILTER', chain: 'forward', action: 'accept', ... };
 */
export type TemplateRule = z.infer<typeof TemplateRuleSchema>;
/**
 * Template conflict detected during preview
 * Identifies conflicts between proposed template rules and existing configuration
 */
export declare const TemplateConflictSchema: z.ZodObject<
  {
    type: z.ZodEnum<
      ['DUPLICATE_RULE', 'IP_OVERLAP', 'CHAIN_CONFLICT', 'POSITION_CONFLICT', 'PORT_CONFLICT']
    >;
    message: z.ZodString;
    existingRuleId: z.ZodOptional<z.ZodString>;
    proposedRule: z.ZodOptional<
      z.ZodObject<
        {
          table: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
          chain: z.ZodString;
          action: z.ZodString;
          comment: z.ZodOptional<z.ZodString>;
          position: z.ZodNullable<z.ZodNumber>;
          properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        },
        'strip',
        z.ZodTypeAny,
        {
          table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
          action: string;
          position: number | null;
          chain: string;
          properties: Record<string, unknown>;
          comment?: string | undefined;
        },
        {
          table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
          action: string;
          position: number | null;
          chain: string;
          properties: Record<string, unknown>;
          comment?: string | undefined;
        }
      >
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    type:
      | 'DUPLICATE_RULE'
      | 'IP_OVERLAP'
      | 'CHAIN_CONFLICT'
      | 'POSITION_CONFLICT'
      | 'PORT_CONFLICT';
    message: string;
    existingRuleId?: string | undefined;
    proposedRule?:
      | {
          table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
          action: string;
          position: number | null;
          chain: string;
          properties: Record<string, unknown>;
          comment?: string | undefined;
        }
      | undefined;
  },
  {
    type:
      | 'DUPLICATE_RULE'
      | 'IP_OVERLAP'
      | 'CHAIN_CONFLICT'
      | 'POSITION_CONFLICT'
      | 'PORT_CONFLICT';
    message: string;
    existingRuleId?: string | undefined;
    proposedRule?:
      | {
          table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
          action: string;
          position: number | null;
          chain: string;
          properties: Record<string, unknown>;
          comment?: string | undefined;
        }
      | undefined;
  }
>;
/**
 * Type for a template conflict detected during preview
 * @example
 * const conflict: TemplateConflict = { type: 'DUPLICATE_RULE', message: '...', ... };
 */
export type TemplateConflict = z.infer<typeof TemplateConflictSchema>;
/**
 * Impact analysis for template application
 * Provides metrics on the consequences of applying a template to the firewall configuration
 */
export declare const ImpactAnalysisSchema: z.ZodObject<
  {
    newRulesCount: z.ZodNumber;
    affectedChains: z.ZodReadonly<z.ZodArray<z.ZodString, 'many'>>;
    estimatedApplyTime: z.ZodNumber;
    warnings: z.ZodReadonly<z.ZodArray<z.ZodString, 'many'>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    warnings: readonly string[];
    newRulesCount: number;
    affectedChains: readonly string[];
    estimatedApplyTime: number;
  },
  {
    warnings: readonly string[];
    newRulesCount: number;
    affectedChains: readonly string[];
    estimatedApplyTime: number;
  }
>;
/**
 * Type for template impact analysis results
 * @example
 * const analysis: ImpactAnalysis = { newRulesCount: 5, affectedChains: ['forward'], ... };
 */
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;
/**
 * Firewall template with variables and rules
 * Complete template definition including all metadata, variables, and rules needed for deployment
 */
export declare const FirewallTemplateSchema: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<['BASIC', 'HOME', 'GAMING', 'IOT', 'GUEST', 'VPN', 'SECURITY', 'CUSTOM']>;
    complexity: z.ZodEnum<['SIMPLE', 'MODERATE', 'ADVANCED', 'EXPERT']>;
    ruleCount: z.ZodNumber;
    variables: z.ZodReadonly<
      z.ZodArray<
        z.ZodObject<
          {
            name: z.ZodString;
            label: z.ZodString;
            type: z.ZodEnum<
              [
                'INTERFACE',
                'SUBNET',
                'IP',
                'PORT',
                'PORT_RANGE',
                'VLAN_ID',
                'STRING',
                'NUMBER',
                'BOOLEAN',
              ]
            >;
            defaultValue: z.ZodOptional<z.ZodString>;
            isRequired: z.ZodBoolean;
            description: z.ZodOptional<z.ZodString>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
          },
          'strip',
          z.ZodTypeAny,
          {
            label: string;
            name: string;
            type:
              | 'PORT'
              | 'INTERFACE'
              | 'SUBNET'
              | 'IP'
              | 'PORT_RANGE'
              | 'VLAN_ID'
              | 'STRING'
              | 'NUMBER'
              | 'BOOLEAN';
            isRequired: boolean;
            defaultValue?: string | undefined;
            description?: string | undefined;
            options?: string[] | undefined;
          },
          {
            label: string;
            name: string;
            type:
              | 'PORT'
              | 'INTERFACE'
              | 'SUBNET'
              | 'IP'
              | 'PORT_RANGE'
              | 'VLAN_ID'
              | 'STRING'
              | 'NUMBER'
              | 'BOOLEAN';
            isRequired: boolean;
            defaultValue?: string | undefined;
            description?: string | undefined;
            options?: string[] | undefined;
          }
        >,
        'many'
      >
    >;
    rules: z.ZodReadonly<
      z.ZodArray<
        z.ZodObject<
          {
            table: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
            chain: z.ZodString;
            action: z.ZodString;
            comment: z.ZodOptional<z.ZodString>;
            position: z.ZodNullable<z.ZodNumber>;
            properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          },
          'strip',
          z.ZodTypeAny,
          {
            table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
            action: string;
            position: number | null;
            chain: string;
            properties: Record<string, unknown>;
            comment?: string | undefined;
          },
          {
            table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
            action: string;
            position: number | null;
            chain: string;
            properties: Record<string, unknown>;
            comment?: string | undefined;
          }
        >,
        'many'
      >
    >;
    isBuiltIn: z.ZodBoolean;
    version: z.ZodString;
    createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
    updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    id: string;
    name: string;
    version: string;
    rules: readonly {
      table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
      action: string;
      position: number | null;
      chain: string;
      properties: Record<string, unknown>;
      comment?: string | undefined;
    }[];
    description: string;
    category: 'VPN' | 'BASIC' | 'CUSTOM' | 'HOME' | 'GAMING' | 'IOT' | 'GUEST' | 'SECURITY';
    isBuiltIn: boolean;
    complexity: 'ADVANCED' | 'SIMPLE' | 'MODERATE' | 'EXPERT';
    ruleCount: number;
    variables: readonly {
      label: string;
      name: string;
      type:
        | 'PORT'
        | 'INTERFACE'
        | 'SUBNET'
        | 'IP'
        | 'PORT_RANGE'
        | 'VLAN_ID'
        | 'STRING'
        | 'NUMBER'
        | 'BOOLEAN';
      isRequired: boolean;
      defaultValue?: string | undefined;
      description?: string | undefined;
      options?: string[] | undefined;
    }[];
    updatedAt?: Date | null | undefined;
    createdAt?: Date | null | undefined;
  },
  {
    id: string;
    name: string;
    version: string;
    rules: readonly {
      table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
      action: string;
      position: number | null;
      chain: string;
      properties: Record<string, unknown>;
      comment?: string | undefined;
    }[];
    description: string;
    category: 'VPN' | 'BASIC' | 'CUSTOM' | 'HOME' | 'GAMING' | 'IOT' | 'GUEST' | 'SECURITY';
    isBuiltIn: boolean;
    complexity: 'ADVANCED' | 'SIMPLE' | 'MODERATE' | 'EXPERT';
    ruleCount: number;
    variables: readonly {
      label: string;
      name: string;
      type:
        | 'PORT'
        | 'INTERFACE'
        | 'SUBNET'
        | 'IP'
        | 'PORT_RANGE'
        | 'VLAN_ID'
        | 'STRING'
        | 'NUMBER'
        | 'BOOLEAN';
      isRequired: boolean;
      defaultValue?: string | undefined;
      description?: string | undefined;
      options?: string[] | undefined;
    }[];
    updatedAt?: Date | null | undefined;
    createdAt?: Date | null | undefined;
  }
>;
/**
 * Type for a complete firewall template
 * @example
 * const template: FirewallTemplate = { id: 'tpl-1', name: 'Web Server', ... };
 */
export type FirewallTemplate = z.infer<typeof FirewallTemplateSchema>;
/**
 * Result of template preview operation
 * Contains the template with resolved rules, any detected conflicts, and impact analysis
 * without actually applying the template to the firewall
 */
export declare const TemplatePreviewResultSchema: z.ZodObject<
  {
    template: z.ZodObject<
      {
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodEnum<
          ['BASIC', 'HOME', 'GAMING', 'IOT', 'GUEST', 'VPN', 'SECURITY', 'CUSTOM']
        >;
        complexity: z.ZodEnum<['SIMPLE', 'MODERATE', 'ADVANCED', 'EXPERT']>;
        ruleCount: z.ZodNumber;
        variables: z.ZodReadonly<
          z.ZodArray<
            z.ZodObject<
              {
                name: z.ZodString;
                label: z.ZodString;
                type: z.ZodEnum<
                  [
                    'INTERFACE',
                    'SUBNET',
                    'IP',
                    'PORT',
                    'PORT_RANGE',
                    'VLAN_ID',
                    'STRING',
                    'NUMBER',
                    'BOOLEAN',
                  ]
                >;
                defaultValue: z.ZodOptional<z.ZodString>;
                isRequired: z.ZodBoolean;
                description: z.ZodOptional<z.ZodString>;
                options: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
              },
              'strip',
              z.ZodTypeAny,
              {
                label: string;
                name: string;
                type:
                  | 'PORT'
                  | 'INTERFACE'
                  | 'SUBNET'
                  | 'IP'
                  | 'PORT_RANGE'
                  | 'VLAN_ID'
                  | 'STRING'
                  | 'NUMBER'
                  | 'BOOLEAN';
                isRequired: boolean;
                defaultValue?: string | undefined;
                description?: string | undefined;
                options?: string[] | undefined;
              },
              {
                label: string;
                name: string;
                type:
                  | 'PORT'
                  | 'INTERFACE'
                  | 'SUBNET'
                  | 'IP'
                  | 'PORT_RANGE'
                  | 'VLAN_ID'
                  | 'STRING'
                  | 'NUMBER'
                  | 'BOOLEAN';
                isRequired: boolean;
                defaultValue?: string | undefined;
                description?: string | undefined;
                options?: string[] | undefined;
              }
            >,
            'many'
          >
        >;
        rules: z.ZodReadonly<
          z.ZodArray<
            z.ZodObject<
              {
                table: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
                chain: z.ZodString;
                action: z.ZodString;
                comment: z.ZodOptional<z.ZodString>;
                position: z.ZodNullable<z.ZodNumber>;
                properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
              },
              'strip',
              z.ZodTypeAny,
              {
                table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
              },
              {
                table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
                action: string;
                position: number | null;
                chain: string;
                properties: Record<string, unknown>;
                comment?: string | undefined;
              }
            >,
            'many'
          >
        >;
        isBuiltIn: z.ZodBoolean;
        version: z.ZodString;
        createdAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
        updatedAt: z.ZodOptional<z.ZodNullable<z.ZodDate>>;
      },
      'strip',
      z.ZodTypeAny,
      {
        id: string;
        name: string;
        version: string;
        rules: readonly {
          table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
          action: string;
          position: number | null;
          chain: string;
          properties: Record<string, unknown>;
          comment?: string | undefined;
        }[];
        description: string;
        category: 'VPN' | 'BASIC' | 'CUSTOM' | 'HOME' | 'GAMING' | 'IOT' | 'GUEST' | 'SECURITY';
        isBuiltIn: boolean;
        complexity: 'ADVANCED' | 'SIMPLE' | 'MODERATE' | 'EXPERT';
        ruleCount: number;
        variables: readonly {
          label: string;
          name: string;
          type:
            | 'PORT'
            | 'INTERFACE'
            | 'SUBNET'
            | 'IP'
            | 'PORT_RANGE'
            | 'VLAN_ID'
            | 'STRING'
            | 'NUMBER'
            | 'BOOLEAN';
          isRequired: boolean;
          defaultValue?: string | undefined;
          description?: string | undefined;
          options?: string[] | undefined;
        }[];
        updatedAt?: Date | null | undefined;
        createdAt?: Date | null | undefined;
      },
      {
        id: string;
        name: string;
        version: string;
        rules: readonly {
          table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
          action: string;
          position: number | null;
          chain: string;
          properties: Record<string, unknown>;
          comment?: string | undefined;
        }[];
        description: string;
        category: 'VPN' | 'BASIC' | 'CUSTOM' | 'HOME' | 'GAMING' | 'IOT' | 'GUEST' | 'SECURITY';
        isBuiltIn: boolean;
        complexity: 'ADVANCED' | 'SIMPLE' | 'MODERATE' | 'EXPERT';
        ruleCount: number;
        variables: readonly {
          label: string;
          name: string;
          type:
            | 'PORT'
            | 'INTERFACE'
            | 'SUBNET'
            | 'IP'
            | 'PORT_RANGE'
            | 'VLAN_ID'
            | 'STRING'
            | 'NUMBER'
            | 'BOOLEAN';
          isRequired: boolean;
          defaultValue?: string | undefined;
          description?: string | undefined;
          options?: string[] | undefined;
        }[];
        updatedAt?: Date | null | undefined;
        createdAt?: Date | null | undefined;
      }
    >;
    resolvedRules: z.ZodReadonly<
      z.ZodArray<
        z.ZodObject<
          {
            table: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
            chain: z.ZodString;
            action: z.ZodString;
            comment: z.ZodOptional<z.ZodString>;
            position: z.ZodNullable<z.ZodNumber>;
            properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
          },
          'strip',
          z.ZodTypeAny,
          {
            table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
            action: string;
            position: number | null;
            chain: string;
            properties: Record<string, unknown>;
            comment?: string | undefined;
          },
          {
            table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
            action: string;
            position: number | null;
            chain: string;
            properties: Record<string, unknown>;
            comment?: string | undefined;
          }
        >,
        'many'
      >
    >;
    conflicts: z.ZodReadonly<
      z.ZodArray<
        z.ZodObject<
          {
            type: z.ZodEnum<
              [
                'DUPLICATE_RULE',
                'IP_OVERLAP',
                'CHAIN_CONFLICT',
                'POSITION_CONFLICT',
                'PORT_CONFLICT',
              ]
            >;
            message: z.ZodString;
            existingRuleId: z.ZodOptional<z.ZodString>;
            proposedRule: z.ZodOptional<
              z.ZodObject<
                {
                  table: z.ZodEnum<['FILTER', 'NAT', 'MANGLE', 'RAW']>;
                  chain: z.ZodString;
                  action: z.ZodString;
                  comment: z.ZodOptional<z.ZodString>;
                  position: z.ZodNullable<z.ZodNumber>;
                  properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
                  action: string;
                  position: number | null;
                  chain: string;
                  properties: Record<string, unknown>;
                  comment?: string | undefined;
                },
                {
                  table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
                  action: string;
                  position: number | null;
                  chain: string;
                  properties: Record<string, unknown>;
                  comment?: string | undefined;
                }
              >
            >;
          },
          'strip',
          z.ZodTypeAny,
          {
            type:
              | 'DUPLICATE_RULE'
              | 'IP_OVERLAP'
              | 'CHAIN_CONFLICT'
              | 'POSITION_CONFLICT'
              | 'PORT_CONFLICT';
            message: string;
            existingRuleId?: string | undefined;
            proposedRule?:
              | {
                  table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
                  action: string;
                  position: number | null;
                  chain: string;
                  properties: Record<string, unknown>;
                  comment?: string | undefined;
                }
              | undefined;
          },
          {
            type:
              | 'DUPLICATE_RULE'
              | 'IP_OVERLAP'
              | 'CHAIN_CONFLICT'
              | 'POSITION_CONFLICT'
              | 'PORT_CONFLICT';
            message: string;
            existingRuleId?: string | undefined;
            proposedRule?:
              | {
                  table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
                  action: string;
                  position: number | null;
                  chain: string;
                  properties: Record<string, unknown>;
                  comment?: string | undefined;
                }
              | undefined;
          }
        >,
        'many'
      >
    >;
    impactAnalysis: z.ZodObject<
      {
        newRulesCount: z.ZodNumber;
        affectedChains: z.ZodReadonly<z.ZodArray<z.ZodString, 'many'>>;
        estimatedApplyTime: z.ZodNumber;
        warnings: z.ZodReadonly<z.ZodArray<z.ZodString, 'many'>>;
      },
      'strip',
      z.ZodTypeAny,
      {
        warnings: readonly string[];
        newRulesCount: number;
        affectedChains: readonly string[];
        estimatedApplyTime: number;
      },
      {
        warnings: readonly string[];
        newRulesCount: number;
        affectedChains: readonly string[];
        estimatedApplyTime: number;
      }
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    template: {
      id: string;
      name: string;
      version: string;
      rules: readonly {
        table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
        action: string;
        position: number | null;
        chain: string;
        properties: Record<string, unknown>;
        comment?: string | undefined;
      }[];
      description: string;
      category: 'VPN' | 'BASIC' | 'CUSTOM' | 'HOME' | 'GAMING' | 'IOT' | 'GUEST' | 'SECURITY';
      isBuiltIn: boolean;
      complexity: 'ADVANCED' | 'SIMPLE' | 'MODERATE' | 'EXPERT';
      ruleCount: number;
      variables: readonly {
        label: string;
        name: string;
        type:
          | 'PORT'
          | 'INTERFACE'
          | 'SUBNET'
          | 'IP'
          | 'PORT_RANGE'
          | 'VLAN_ID'
          | 'STRING'
          | 'NUMBER'
          | 'BOOLEAN';
        isRequired: boolean;
        defaultValue?: string | undefined;
        description?: string | undefined;
        options?: string[] | undefined;
      }[];
      updatedAt?: Date | null | undefined;
      createdAt?: Date | null | undefined;
    };
    conflicts: readonly {
      type:
        | 'DUPLICATE_RULE'
        | 'IP_OVERLAP'
        | 'CHAIN_CONFLICT'
        | 'POSITION_CONFLICT'
        | 'PORT_CONFLICT';
      message: string;
      existingRuleId?: string | undefined;
      proposedRule?:
        | {
            table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
            action: string;
            position: number | null;
            chain: string;
            properties: Record<string, unknown>;
            comment?: string | undefined;
          }
        | undefined;
    }[];
    resolvedRules: readonly {
      table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
      action: string;
      position: number | null;
      chain: string;
      properties: Record<string, unknown>;
      comment?: string | undefined;
    }[];
    impactAnalysis: {
      warnings: readonly string[];
      newRulesCount: number;
      affectedChains: readonly string[];
      estimatedApplyTime: number;
    };
  },
  {
    template: {
      id: string;
      name: string;
      version: string;
      rules: readonly {
        table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
        action: string;
        position: number | null;
        chain: string;
        properties: Record<string, unknown>;
        comment?: string | undefined;
      }[];
      description: string;
      category: 'VPN' | 'BASIC' | 'CUSTOM' | 'HOME' | 'GAMING' | 'IOT' | 'GUEST' | 'SECURITY';
      isBuiltIn: boolean;
      complexity: 'ADVANCED' | 'SIMPLE' | 'MODERATE' | 'EXPERT';
      ruleCount: number;
      variables: readonly {
        label: string;
        name: string;
        type:
          | 'PORT'
          | 'INTERFACE'
          | 'SUBNET'
          | 'IP'
          | 'PORT_RANGE'
          | 'VLAN_ID'
          | 'STRING'
          | 'NUMBER'
          | 'BOOLEAN';
        isRequired: boolean;
        defaultValue?: string | undefined;
        description?: string | undefined;
        options?: string[] | undefined;
      }[];
      updatedAt?: Date | null | undefined;
      createdAt?: Date | null | undefined;
    };
    conflicts: readonly {
      type:
        | 'DUPLICATE_RULE'
        | 'IP_OVERLAP'
        | 'CHAIN_CONFLICT'
        | 'POSITION_CONFLICT'
        | 'PORT_CONFLICT';
      message: string;
      existingRuleId?: string | undefined;
      proposedRule?:
        | {
            table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
            action: string;
            position: number | null;
            chain: string;
            properties: Record<string, unknown>;
            comment?: string | undefined;
          }
        | undefined;
    }[];
    resolvedRules: readonly {
      table: 'FILTER' | 'NAT' | 'MANGLE' | 'RAW';
      action: string;
      position: number | null;
      chain: string;
      properties: Record<string, unknown>;
      comment?: string | undefined;
    }[];
    impactAnalysis: {
      warnings: readonly string[];
      newRulesCount: number;
      affectedChains: readonly string[];
      estimatedApplyTime: number;
    };
  }
>;
/**
 * Type for template preview result
 * @example
 * const preview: TemplatePreviewResult = { template: {...}, resolvedRules: [...], ... };
 */
export type TemplatePreviewResult = z.infer<typeof TemplatePreviewResultSchema>;
/**
 * Result of template apply operation
 * Reports the outcome of applying a template to the firewall including success status and rollback info
 */
export declare const FirewallTemplateResultSchema: z.ZodObject<
  {
    isSuccessful: z.ZodBoolean;
    appliedRulesCount: z.ZodNumber;
    rollbackId: z.ZodString;
    errors: z.ZodReadonly<z.ZodArray<z.ZodString, 'many'>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    errors: readonly string[];
    isSuccessful: boolean;
    appliedRulesCount: number;
    rollbackId: string;
  },
  {
    errors: readonly string[];
    isSuccessful: boolean;
    appliedRulesCount: number;
    rollbackId: string;
  }
>;
/**
 * Type for firewall template application result
 * @example
 * const result: FirewallTemplateResult = { isSuccessful: true, appliedRulesCount: 5, rollbackId: '...', errors: [] };
 */
export type FirewallTemplateResult = z.infer<typeof FirewallTemplateResultSchema>;
//# sourceMappingURL=template.types.d.ts.map
