/**
 * Network Data Test Fixtures
 *
 * Test data for IP, MAC, subnet, and port validation testing.
 * Includes valid and invalid examples for comprehensive test coverage.
 *
 * @module @nasnet/ui/patterns/test/__fixtures__/network-data
 * @see NAS-4A.24: Implement Component Tests and Visual Regression
 */
export declare const validIPv4Addresses: {
    value: string;
    type: string;
    description: string;
}[];
export declare const invalidIPv4Addresses: {
    value: string;
    error: string;
}[];
export declare const ipv4Segments: {
    valid: string[];
    invalid: string[];
};
export declare const validCIDRNotations: {
    value: string;
    mask: string;
    hosts: number;
}[];
export declare const invalidCIDRNotations: {
    value: string;
    error: string;
}[];
export declare const validMACAddresses: {
    value: string;
    format: string;
}[];
export declare const invalidMACAddresses: {
    value: string;
    error: string;
}[];
export declare const validPorts: ({
    value: number;
    name: string;
    description: string;
} | {
    value: number;
    name: null;
    description: string;
})[];
export declare const invalidPorts: ({
    value: number;
    error: string;
} | {
    value: string;
    error: string;
})[];
export declare const portRanges: {
    valid: {
        start: number;
        end: number;
        description: string;
    }[];
    invalid: {
        start: number;
        end: number;
        error: string;
    }[];
};
export declare const wellKnownPorts: Record<number, string>;
export declare const interfaceTypes: readonly ["ethernet", "bridge", "vlan", "wireless", "loopback", "tunnel"];
export type InterfaceType = typeof interfaceTypes[number];
export declare const mockInterfaces: ({
    name: string;
    type: InterfaceType;
    status: string;
    mac: string;
    ip: string;
    vlanId?: undefined;
} | {
    name: string;
    type: InterfaceType;
    status: string;
    mac: string;
    ip: string;
    vlanId: number;
} | {
    name: string;
    type: InterfaceType;
    status: string;
    mac: string;
    ip?: undefined;
    vlanId?: undefined;
} | {
    name: string;
    type: InterfaceType;
    status: string;
    ip: string;
    mac?: undefined;
    vlanId?: undefined;
})[];
//# sourceMappingURL=network-data.d.ts.map