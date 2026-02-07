/**
 * DNS Page Integration Tests
 *
 * Integration tests for the complete DNS page flow with mocked GraphQL API.
 * Story: NAS-6.4 - Implement DNS Configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { graphql, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MockedProvider } from '@apollo/client/testing';
import { DnsPage } from './DnsPage';
import type { DNSSettings, DNSStaticEntry } from '@nasnet/core/types';

// Mock router params
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ id: 'test-router-id' }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// MSW server setup
const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// Mock data
const mockDnsSettings: DNSSettings = {
  servers: '1.1.1.1,8.8.8.8',
  'dynamic-servers': '192.168.1.1',
  'cache-size': 2048,
  'cache-used': 1024,
  'allow-remote-requests': false,
  'cache-max-ttl': '1w',
  'max-concurrent-queries': 100,
  'max-concurrent-tcp-sessions': 20,
  'max-udp-packet-size': 4096,
};

const mockStaticEntries: DNSStaticEntry[] = [
  {
    '.id': '*1',
    name: 'nas.local',
    address: '192.168.1.50',
    ttl: '1d',
    disabled: false,
    comment: 'NAS server',
  },
  {
    '.id': '*2',
    name: 'printer.local',
    address: '192.168.1.100',
    ttl: '1d',
    disabled: false,
  },
];

describe('DnsPage Integration', () => {
  describe('initial load', () => {
    it('should load and display DNS settings successfully', async () => {
      server.use(
        graphql.query('GetDNSSettings', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsSettings: mockDnsSettings,
              },
            },
          });
        }),
        graphql.query('GetDNSStaticEntries', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsStaticEntries: mockStaticEntries,
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      // Should show loading initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
        expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      });

      // Check static entries are displayed
      expect(screen.getByText('nas.local')).toBeInTheDocument();
      expect(screen.getByText('printer.local')).toBeInTheDocument();
    });

    it('should display error state when API fails', async () => {
      server.use(
        graphql.query('GetDNSSettings', () => {
          return HttpResponse.json({
            errors: [{ message: 'Network error' }],
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should display cache usage correctly', async () => {
      server.use(
        graphql.query('GetDNSSettings', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsSettings: mockDnsSettings,
              },
            },
          });
        }),
        graphql.query('GetDNSStaticEntries', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsStaticEntries: [],
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/1024 KB \/ 2048 KB \(50%\)/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('DNS server management', () => {
    beforeEach(() => {
      server.use(
        graphql.query('GetDNSSettings', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsSettings: mockDnsSettings,
              },
            },
          });
        }),
        graphql.query('GetDNSStaticEntries', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsStaticEntries: mockStaticEntries,
              },
            },
          });
        })
      );
    });

    it('should open add server dialog when add button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      await user.click(addButton);

      // Should open dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should add new DNS server successfully', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('UpdateDNSSettings', () => {
          return HttpResponse.json({
            data: {
              updateDNSSettings: {
                servers: '1.1.1.1,8.8.8.8,9.9.9.9',
                allowRemoteRequests: false,
                cacheSize: 2048,
                cacheUsed: 1024,
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add dns server/i });
      await user.click(addButton);

      // Fill in form
      const ipInput = screen.getByRole('textbox', { name: /ip address/i });
      await user.type(ipInput, '9.9.9.9');

      // Submit
      const submitButton = screen.getByRole('button', { name: /add/i });
      await user.click(submitButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/added successfully/i)).toBeInTheDocument();
      });
    });

    it('should remove DNS server successfully', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('UpdateDNSSettings', () => {
          return HttpResponse.json({
            data: {
              updateDNSSettings: {
                servers: '8.8.8.8',
                allowRemoteRequests: false,
                cacheSize: 2048,
                cacheUsed: 1024,
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      // Click remove button for first server
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      // Confirm in dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/removed successfully/i)).toBeInTheDocument();
      });
    });

    it('should prevent removing dynamic servers', async () => {
      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      });

      // Dynamic server should have "Dynamic" badge, not remove button
      const dynamicBadge = screen.getByText('Dynamic');
      expect(dynamicBadge).toBeInTheDocument();

      // No remove button for dynamic server
      const dynamicServerRow = screen
        .getByText('192.168.1.1')
        .closest('div');
      const removeButton = dynamicServerRow?.querySelector(
        'button[aria-label*="remove"]'
      );
      expect(removeButton).not.toBeInTheDocument();
    });
  });

  describe('static DNS entries management', () => {
    beforeEach(() => {
      server.use(
        graphql.query('GetDNSSettings', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsSettings: mockDnsSettings,
              },
            },
          });
        }),
        graphql.query('GetDNSStaticEntries', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsStaticEntries: mockStaticEntries,
              },
            },
          });
        })
      );
    });

    it('should create new static entry successfully', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('CreateDNSStaticEntry', () => {
          return HttpResponse.json({
            data: {
              createDNSStaticEntry: {
                id: '*3',
                name: 'router.local',
                address: '192.168.1.1',
                ttl: 86400,
                comment: 'Main router',
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('nas.local')).toBeInTheDocument();
      });

      // Click add entry button
      const addButton = screen.getByRole('button', {
        name: /add static entry/i,
      });
      await user.click(addButton);

      // Fill in form
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByRole('textbox', { name: /hostname/i });
      const addressInput = screen.getByRole('textbox', { name: /ip address/i });
      const commentInput = screen.getByRole('textbox', { name: /comment/i });

      await user.type(nameInput, 'router.local');
      await user.type(addressInput, '192.168.1.1');
      await user.type(commentInput, 'Main router');

      // Submit
      const submitButton = screen.getByRole('button', { name: /add/i });
      await user.click(submitButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/added successfully/i)).toBeInTheDocument();
      });
    });

    it('should delete static entry successfully', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('DeleteDNSStaticEntry', () => {
          return HttpResponse.json({
            data: {
              deleteDNSStaticEntry: {
                success: true,
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('nas.local')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to delete/i)
        ).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument();
      });
    });

    it('should validate hostname format', async () => {
      const user = userEvent.setup();

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('nas.local')).toBeInTheDocument();
      });

      // Click add entry button
      const addButton = screen.getByRole('button', {
        name: /add static entry/i,
      });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByRole('textbox', { name: /hostname/i });

      // Enter invalid hostname
      await user.type(nameInput, '-invalid.local');
      await user.tab(); // Trigger validation

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid hostname/i)).toBeInTheDocument();
      });
    });
  });

  describe('settings changes', () => {
    beforeEach(() => {
      server.use(
        graphql.query('GetDNSSettings', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsSettings: mockDnsSettings,
              },
            },
          });
        }),
        graphql.query('GetDNSStaticEntries', () => {
          return HttpResponse.json({
            data: {
              device: {
                dnsStaticEntries: [],
              },
            },
          });
        })
      );
    });

    it('should show security warning when enabling remote requests', async () => {
      const user = userEvent.setup();

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      // Toggle remote requests
      const checkbox = screen.getByRole('checkbox', {
        name: /allow remote requests/i,
      });
      await user.click(checkbox);

      // Should show security warning
      await waitFor(() => {
        expect(screen.getByText(/security warning/i)).toBeInTheDocument();
        expect(
          screen.getByText(/enabling remote requests allows any device/i)
        ).toBeInTheDocument();
      });
    });

    it('should update cache size successfully', async () => {
      const user = userEvent.setup();

      server.use(
        graphql.mutation('UpdateDNSSettings', () => {
          return HttpResponse.json({
            data: {
              updateDNSSettings: {
                servers: '1.1.1.1,8.8.8.8',
                allowRemoteRequests: false,
                cacheSize: 4096,
                cacheUsed: 1024,
              },
            },
          });
        })
      );

      render(
        <MockedProvider>
          <DnsPage />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      const cacheSizeInput = screen.getByRole('spinbutton', {
        name: /cache size/i,
      });

      await user.clear(cacheSizeInput);
      await user.type(cacheSizeInput, '4096');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
      });
    });
  });
});
