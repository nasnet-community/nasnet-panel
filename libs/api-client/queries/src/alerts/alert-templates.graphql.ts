import { gql } from '@apollo/client';

// Fragments
export const ALERT_TEMPLATE_FRAGMENT = gql`
  fragment AlertTemplateFields on AlertTemplate {
    id
    eventType
    channel
    subjectTemplate
    bodyTemplate
    isDefault
    createdAt
    updatedAt
  }
`;

// Query: List templates
export const GET_ALERT_TEMPLATES = gql`
  ${ALERT_TEMPLATE_FRAGMENT}
  query GetAlertTemplates($eventType: String, $channel: NotificationChannel) {
    alertTemplates(eventType: $eventType, channel: $channel) {
      ...AlertTemplateFields
    }
  }
`;

// Query: Get single template
export const GET_ALERT_TEMPLATE = gql`
  ${ALERT_TEMPLATE_FRAGMENT}
  query GetAlertTemplate($id: ID!) {
    alertTemplate(id: $id) {
      ...AlertTemplateFields
    }
  }
`;

// Mutation: Save template
export const SAVE_ALERT_TEMPLATE = gql`
  ${ALERT_TEMPLATE_FRAGMENT}
  mutation SaveAlertTemplate($input: SaveAlertTemplateInput!) {
    saveAlertTemplate(input: $input) {
      template {
        ...AlertTemplateFields
      }
      errors
    }
  }
`;

// Mutation: Reset to default
export const RESET_ALERT_TEMPLATE = gql`
  mutation ResetAlertTemplate($eventType: String!, $channel: NotificationChannel!) {
    resetAlertTemplate(eventType: $eventType, channel: $channel) {
      success
      errors
    }
  }
`;

// Query: Preview template
export const PREVIEW_NOTIFICATION_TEMPLATE = gql`
  query PreviewNotificationTemplate($input: PreviewNotificationTemplateInput!) {
    previewNotificationTemplate(input: $input) {
      subject
      body
      errors
    }
  }
`;
