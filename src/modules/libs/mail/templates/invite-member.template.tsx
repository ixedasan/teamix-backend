import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from '@react-email/components'
import { Html } from '@react-email/html'
import * as React from 'react'

interface InviteMemberTemplateProps {
  domain: string
  projectName: string
  token: string
}

export function InviteMemberTemplate({ 
  domain, 
  projectName, 
  token 
}: InviteMemberTemplateProps) {
  const invitationLink = `${domain}/join?token=${token}`

  return (
    <Html>
      <Head />
      <Preview>Invitation to join {projectName}</Preview>
      <Tailwind>
        <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
          <Section className='text-center mb-8'>
            <Heading className='text-3xl text-black font-bold'>
              Project Invitation
            </Heading>
            <Text className='text-base text-black'>
              You invited to join {projectName} on TEAMIX! Click the button below to accept the invitation:
            </Text>
            <Link href={invitationLink} className='inline-flex justify-center items-center rounded-full text-sm font-medium text-white bg-[#18B9AE] px-5 py-2'>
              Join Project
            </Link>
          </Section>

          <Section className='text-center mt-8'>
            <Text className='text-gray-600'>
              If you have any questions, contact our support team at{' '}
              <Link 
                href="" 
                className="text-[#18b9ae] underline"
              >
                teamix@help.com
              </Link>.
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  )
}