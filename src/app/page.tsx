import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <h1 className="text-6xl font-bold text-gray-900 mb-8 tracking-tight">
            Quote Pilot
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Streamline your quote management process with our intelligent platform.
            Create, track, and manage quotes efficiently.
          </p>
        </div>

        {/* Main Action Blocks */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          {/* Email Submission Block */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-2xl">Submit a Quote Request</CardTitle>
              <CardDescription className="text-base">
                Send your quote request via email to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-gray-600 leading-relaxed">
                Simply send an email to{' '}
                <span className="font-mono bg-gray-100 px-3 py-1.5 rounded-md text-sm">
                  quotepilot-mvp@callback.email
                </span>
                {' '}with your request details.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="mailto:quotepilot-mvp@callback.email">
                  Send Email Request
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* View Requests Block */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-2xl">View Quote Requests</CardTitle>
              <CardDescription className="text-base">
                Access your incoming requests and suggested routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-gray-600 leading-relaxed">
                View all incoming quote requests, suggested routes, and price calculations in one place.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/requests">
                  View Requests
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <hr className="my-16 border-gray-200" />

        {/* Technical Stack Block */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-2xl">Technologies Used</CardTitle>
            <CardDescription className="text-base">
              Our platform is built with modern, reliable technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-4 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>NextJS (client and backend side)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>
                  <a href="https://owlrelay.email/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    OwlRelay.email
                  </a>
                  {' '}for email to webhook delivery
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>OpenAI (gpt-4o) for parsing emails</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Google Maps API for address geocoding</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Prisma ORM</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Postgres DB (Neon hosting)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Vercel for hosting</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Shadcn UI for components</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* System Limitations Block */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-2xl">System Limitations & Notes</CardTitle>
            <CardDescription className="text-base">
              Important information about the system&apos;s functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-gray-600">
              <li className="flex items-start space-x-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                <span>Only parsing requests when they have details about the delivery size and weight. When those are missing, system should automatically follow up with the customer to get the details (to be implemented)</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                <span>Time for customs and airport handling is not included in the delivery duration</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                <span>Timezone is not included in the delivery duration</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                <span>All prices are calculated in EUR</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                <span>System doesn&apos;t respond with any emails, only provides data in the Web UI (as per requirements)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
