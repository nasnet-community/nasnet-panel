import { component$, $ } from "@builder.io/qwik";

import { Newsletter } from "../Newsletter";

// import { subscribeToNewsletterSendGrid } from "~/utils/newsletterAPI";
import type { NewsletterSubscription } from "../Newsletter.types";


/**
 * Newsletter Subscription API
 *
 * Handles newsletter subscription functionality with Supabase Edge Functions
 */

// Environment variables
const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_BASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const NEWSLETTER_FUNCTION_PATH =
  import.meta.env.VITE_NEWSLETTER_FUNCTION_PATH || "/functions/v1/newsletter";
const REQUEST_TIMEOUT = parseInt(
  import.meta.env.VITE_API_TIMEOUT || "30000",
  10,
);

// Newsletter subscription interfaces
export interface NewsletterSubscriptionRequest {
  email: string;
  userUUID: string;
}

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message?: string;
  error?: string;
  error_detail?: string;
}

export async function subscribeToNewsletter(
  email: string,
  userUUID: string,
): Promise<NewsletterSubscriptionResponse> {
  try {
    if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase configuration not found");
    }

    const url = `${SUPABASE_BASE_URL}${NEWSLETTER_FUNCTION_PATH}`;

    const requestBody: NewsletterSubscriptionRequest = {
      email: email.toLowerCase().trim(),
      userUUID,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited
        return {
          success: false,
          error: "Too many requests",
          error_detail: "Please wait before trying again",
        };
      }
      if (response.status === 403) {
        // Unauthorized
        return {
          success: false,
          error: "Request blocked",
          error_detail: "Request was blocked by security policies",
        };
      }
      // All other errors return generic message
      return {
        success: false,
        error: "Subscription failed",
        error_detail: "Please try again later",
      };
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return {
        success: false,
        error: "Subscription failed",
        error_detail: "Invalid server response",
      };
    }

    return data;
  } catch (error: unknown) {
    return {
      success: false,
      error: "Subscription failed",
      error_detail: "Please try again later",
    };
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254 && email.length >= 5;
}

/**
 * Twilio SendGrid Newsletter Subscription
 * 
 * Subscribes an email to the newsletter using Twilio SendGrid API.
 * This function calls the server-side API endpoint that handles SendGrid integration.
 */

export interface SendGridSubscriptionRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
}

export interface SendGridSubscriptionResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  error?: string;
  details?: string;
}

/**
 * Subscribe to newsletter using Twilio SendGrid
 * 
 * @param email - Email address to subscribe
 * @param options - Optional subscriber information
 * @returns Promise with subscription response
 * 
 * @example
 * ```typescript
 * const result = await subscribeToNewsletterSendGrid('user@example.com', {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   source: 'homepage-newsletter'
 * });
 * ```
 */
export async function subscribeToNewsletterSendGrid(
  email: string,
  options?: Omit<SendGridSubscriptionRequest, 'email'>
): Promise<SendGridSubscriptionResponse> {
  try {
    // Validate email
    if (!validateEmail(email)) {
      return {
        success: false,
        error: "Invalid email address",
        details: "Please enter a valid email address",
      };
    }

    // Prepare request body
    const requestBody: SendGridSubscriptionRequest = {
      email: email.toLowerCase().trim(),
      ...options,
    };

    // In development mode, simulate success if API is not available
    // Temporarily disabled to test actual SendGrid API
    // if (import.meta.env.DEV) {
    //   console.log("Development mode: Simulating newsletter subscription for:", email);
    //   // Simulate a short delay like a real API call
    //   await new Promise(resolve => setTimeout(resolve, 1000));
    //   return {
    //     success: true,
    //     message: "Successfully subscribed to newsletter (dev mode)",
    //     jobId: "dev-" + Date.now(),
    //   };
    // }

    // Call the server-side API endpoint
    console.log("SendGrid API Request:", {
      url: "/api/newsletter/subscribe",
      method: "POST",
      body: requestBody,
    });

    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to parse error response, but handle if it's not JSON
      let errorData: SendGridSubscriptionResponse | null = null;
      try {
        errorData = await response.json() as SendGridSubscriptionResponse;
      } catch {
        // Response is not JSON
        console.warn("API response is not JSON");
      }

      return {
        success: false,
        error: errorData?.error || "Subscription failed",
        details: errorData?.details || `Server error: ${response.status}`,
      };
    }

    // Parse successful response
    const data = await response.json() as SendGridSubscriptionResponse;
    console.log("SendGrid subscription successful! Job ID:", data.jobId);
    return data;
  } catch (error) {
    console.error("Newsletter subscription error:", error);

    // Check if it's a network error (endpoint not found)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: "Service unavailable",
        details: "Newsletter service is currently unavailable. Please try again later.",
      };
    }

    return {
      success: false,
      error: "Network error",
      details: "Please check your connection and try again",
    };
  }
}



/**
 * Newsletter example with Twilio SendGrid integration
 * 
 * This example demonstrates how to integrate the Newsletter component
 * with Twilio SendGrid for managing email subscriptions.
 * 
 * Setup Required:
 * 1. Set SENDGRID_API_KEY environment variable
 * 2. (Optional) Set SENDGRID_LIST_IDS environment variable
 * 3. Ensure the API endpoint is deployed at /api/newsletter/subscribe
 * 
 * @see https://www.twilio.com/docs/sendgrid/api-reference/contacts/add-or-update-a-contact
 */
export const SendGridNewsletter = component$(() => {
  // Handle newsletter subscription with SendGrid
  const handleSubscription$ = $(async (subscription: NewsletterSubscription) => {
    console.log("[SendGrid][INFO] Starting subscription process", {
      email: subscription.email,
      source: subscription.source,
      timestamp: subscription.timestamp,
    });

    try {
      // Call the SendGrid API
      const startTime = Date.now();
      const result = await subscribeToNewsletterSendGrid(subscription.email, {
        source: subscription.source || "newsletter-component",
      });
      const duration = Date.now() - startTime;

      console.log("[SendGrid][INFO] API call completed", {
        duration: `${duration}ms`,
        success: result.success,
      });

      if (!result.success) {
        console.error("[SendGrid][ERROR] Subscription failed", {
          error: result.error,
          email: subscription.email,
        });
        // Throw error to trigger error state in Newsletter component
        throw new Error(result.error || $localize`Subscription failed`);
      }

      // Success - the Newsletter component will show success state
      console.log("[SendGrid][INFO] Subscription successful", {
        jobId: result.jobId,
        email: subscription.email,
      });
      
      // Optional: Track the subscription in analytics
      if (typeof window !== "undefined" && (window as any).gtag) {
        console.log("[SendGrid][INFO] Tracking analytics event");
        (window as any).gtag("event", "newsletter_subscribe", {
          method: "sendgrid",
          email: subscription.email,
        });
      }
    } catch (error) {
      console.error("[SendGrid][ERROR] Unexpected error during subscription:", error);
      throw error; // Re-throw to let Newsletter component handle it
    }
  });

  return (
    <div class="space-y-8 p-8">
      <div class="text-center space-y-4">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {$localize`SendGrid Newsletter Integration`}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {$localize`Newsletter subscription powered by Twilio SendGrid`}
        </p>
      </div>

      {/* Default Newsletter with SendGrid */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {$localize`Standard Newsletter (Responsive)`}
        </h3>
        <Newsletter
          title={$localize`Stay Connected with NASNET`}
          description={$localize`Get the latest router configuration tips, security updates, and exclusive content delivered to your inbox.`}
          onSubscribe$={handleSubscription$}
        />
      </div>

      {/* Compact Newsletter for Sidebar */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {$localize`Compact Version (Sidebar)`}
        </h3>
        <Newsletter
          variant="vertical"
          size="sm"
          compact={true}
          title={$localize`Quick Updates`}
          description={$localize`Stay informed about new features and updates.`}
          showLogo={false}
          onSubscribe$={handleSubscription$}
        />
      </div>

      {/* Hero Newsletter */}
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {$localize`Hero Section Newsletter`}
        </h3>
        <Newsletter
          variant="horizontal"
          size="lg"
          title={$localize`Router Security Newsletter`}
          description={$localize`Join thousands of network administrators receiving weekly security updates, configuration best practices, and expert tips for MikroTik routers.`}
          placeholder={$localize`your.email@example.com`}
          buttonText={$localize`Get Security Updates`}
          onSubscribe$={handleSubscription$}
        />
      </div>

      {/* Glassmorphism Style */}
      <div class="space-y-4 relative">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {$localize`Modern Glass Effect`}
        </h3>
        {/* Background gradient for glass effect */}
        <div class="absolute inset-4 bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-primary-500/20 rounded-2xl -z-10" />
        <Newsletter
          theme="glass"
          glassmorphism={true}
          title={$localize`Premium Updates`}
          description={$localize`Exclusive content for professional network administrators.`}
          onSubscribe$={handleSubscription$}
          showLogo={false}
        />
      </div>

      {/* Setup Instructions */}
      <div class="mt-12 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 class="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
          {$localize`Setup Instructions`}
        </h3>
        <ol class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li class="flex gap-2">
            <span class="font-bold">1.</span>
            <span>
              {$localize`Get your SendGrid API key from`}{" "}
              <a
                href="https://app.sendgrid.com/settings/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                class="underline hover:text-blue-600"
              >
                SendGrid Dashboard
              </a>
            </span>
          </li>
          <li class="flex gap-2">
            <span class="font-bold">2.</span>
            <span>{$localize`Add SENDGRID_API_KEY to your environment variables`}</span>
          </li>
          <li class="flex gap-2">
            <span class="font-bold">3.</span>
            <span>{$localize`(Optional) Add SENDGRID_LIST_IDS to assign contacts to specific lists`}</span>
          </li>
          <li class="flex gap-2">
            <span class="font-bold">4.</span>
            <span>{$localize`Deploy the API endpoint at /api/newsletter/subscribe`}</span>
          </li>
        </ol>
      </div>
    </div>
  );
});

