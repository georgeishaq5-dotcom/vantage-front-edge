import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface TestEmailProps {
  /** When the test was triggered — human-readable string. */
  sentAt?: string
}

const NAVY = '#0B1B2A'
const GREEN = '#00A859'

const TestEmail = ({ sentAt }: TestEmailProps) => {
  const timestamp = sentAt ?? new Date().toUTCString()
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Test email from Vantage — deliverability and branding check</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand header */}
          <Section style={header}>
            <Text style={wordmark}>
              VANT<span style={{ color: GREEN }}>A</span>GE
            </Text>
            <Text style={tagline}>Field Service Manager</Text>
          </Section>

          <Section style={card}>
            <Heading style={heading}>Your email setup is working ✅</Heading>
            <Text style={paragraph}>
              This is a test email from <strong>Vantage</strong>, sent through your
              verified sending domain <strong>notify.vantage-fsm.com</strong>.
            </Text>
            <Text style={paragraph}>
              If you're reading this in your inbox, deliverability is configured
              correctly and your brand styling renders as expected.
            </Text>

            <Section style={badge}>
              <Text style={badgeText}>Sent: {timestamp}</Text>
            </Section>

            <Hr style={hr} />
            <Text style={footnote}>
              Since this is a newly verified sending domain, deliverability
              improves over the first 2–4 weeks as inbox providers build trust.
            </Text>
          </Section>

          <Text style={footer}>Vantage · Field Service Management</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TestEmail,
  subject: 'Vantage test email — deliverability check',
  displayName: 'Test Email',
  previewData: { sentAt: 'Sat, 27 Jun 2026 12:00:00 GMT' },
} satisfies TemplateEntry

export default TestEmail

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  padding: '24px 0',
}

const container: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '0 16px',
}

const header: React.CSSProperties = {
  textAlign: 'center',
  padding: '8px 0 20px',
}

const wordmark: React.CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '2px',
  color: NAVY,
}

const tagline: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: '12px',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: '#6b7280',
}

const card: React.CSSProperties = {
  backgroundColor: NAVY,
  borderRadius: '14px',
  padding: '32px 28px',
}

const heading: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: '20px',
  fontWeight: 700,
  color: '#ffffff',
}

const paragraph: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: '15px',
  lineHeight: '24px',
  color: '#cbd5e1',
}

const badge: React.CSSProperties = {
  marginTop: '8px',
  padding: '10px 14px',
  backgroundColor: 'rgba(0, 168, 89, 0.15)',
  border: `1px solid ${GREEN}`,
  borderRadius: '8px',
}

const badgeText: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 600,
  color: GREEN,
}

const hr: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.12)',
  margin: '24px 0 16px',
}

const footnote: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  lineHeight: '18px',
  color: '#94a3b8',
}

const footer: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '20px',
  fontSize: '12px',
  color: '#9ca3af',
}
