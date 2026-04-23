import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Stack,
} from '@nasnet/ui';

interface StubProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
}

const StubShell: React.FC<StubProps> = ({ title, description, icon, ctaLabel, ctaHref }) => {
  const navigate = useNavigate();
  return (
    <Stack>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <EmptyState
          title={`${title} coming soon`}
          description="This section is stubbed. Backend wiring lands in a follow-up pass."
          icon={icon}
          actions={
            ctaHref ? (
              <Button onClick={() => navigate(ctaHref)}>{ctaLabel ?? 'Continue'}</Button>
            ) : undefined
          }
        />
      </Card>
    </Stack>
  );
};

export function DNSPage() {
  return (
    <StubShell
      title="DNS"
      description="Local DNS cache, static entries, and forwarders."
      icon={<Globe size={22} />}
    />
  );
}
