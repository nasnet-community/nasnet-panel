/**
 * Application Constants Module
 *
 * Central export point for all application constants organized by domain:
 * - **Routes** (`./routes`) - All application navigation routes
 * - **API Endpoints** (`./api-endpoints`) - Backend API endpoint definitions
 * - **Socket Events** (`./socket-events`) - WebSocket event names for real-time communication
 * - **Well-Known Ports** (`./well-known-ports`) - Database of well-known service ports
 *
 * @module @nasnet/core/constants
 *
 * @example
 * ```ts
 * import {
 *   ROUTES,
 *   API_ENDPOINTS,
 *   SOCKET_EVENTS_EMIT,
 *   SOCKET_EVENTS_ON,
 *   WELL_KNOWN_PORTS,
 *   getServiceByPort,
 *   searchPorts,
 * } from '@nasnet/core/constants';
 *
 * // Navigate to router list
 * navigate(ROUTES.ROUTER_LIST);
 *
 * // Fetch from API endpoint
 * fetch(API_ENDPOINTS.ROUTER_LIST);
 *
 * // Emit socket event
 * socket.emit(SOCKET_EVENTS_EMIT.ROUTER_SUBSCRIBE);
 *
 * // Look up service by port
 * const service = getServiceByPort(80); // 'HTTP'
 * ```
 */

// Routes
export * from './routes';

// API Endpoints
export * from './api-endpoints';

// Socket Events
export * from './socket-events';

// Well-Known Ports (NAS-4A.8)
export * from './well-known-ports';
