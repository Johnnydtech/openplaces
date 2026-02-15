import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Upload, Map, TrendingUp, Shield, Clock, Target } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-teal-950 via-deep-teal-900 to-deep-teal-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Brand */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-lime-500/10 px-4 py-2 border border-lime-500/30">
            <Target className="h-5 w-5 text-lime-500" />
            <span className="text-sm font-semibold uppercase tracking-wider text-lime-500">
              Strategic Ad Placement
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find the <span className="text-lime-500">Perfect Spot</span>
            <br />
            for Your Event
          </h1>

          <p className="mb-10 text-xl text-gray-300 sm:text-2xl">
            AI-powered recommendations for strategic ad placement in Arlington, VA.
            Upload your flyer, get ranked locations in 60 seconds.
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={() => navigate('/upload')}
            className="group text-base px-8 py-6 h-auto"
          >
            <Upload className="h-5 w-5 transition-transform group-hover:scale-110" />
            Upload Event Flyer
          </Button>

          <p className="mt-4 text-sm text-gray-400">
            No signup required • Free to use • Results in 60 seconds
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="group cursor-pointer">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
                <Map className="h-6 w-6 text-lime-500" />
              </div>
              <CardTitle>Geographic Intelligence</CardTitle>
              <CardDescription>
                Interactive map shows optimal placement zones based on foot traffic patterns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
                <TrendingUp className="h-6 w-6 text-lime-500" />
              </div>
              <CardTitle>Audience Match Scoring</CardTitle>
              <CardDescription>
                AI analyzes your event and matches it to zones where your target audience gathers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
                <Shield className="h-6 w-6 text-lime-500" />
              </div>
              <CardTitle>Risk Warnings</CardTitle>
              <CardDescription>
                Get warned about bad placements before wasting money on ineffective locations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
                <Clock className="h-6 w-6 text-lime-500" />
              </div>
              <CardTitle>Time-Based Analysis</CardTitle>
              <CardDescription>
                Morning, lunch, and evening recommendations based on when your audience is active
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
                <Target className="h-6 w-6 text-lime-500" />
              </div>
              <CardTitle>Transparent Reasoning</CardTitle>
              <CardDescription>
                Every recommendation shows exactly why it was suggested with real community data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group cursor-pointer">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/10 transition-colors group-hover:bg-lime-500/20">
                <Upload className="h-6 w-6 text-lime-500" />
              </div>
              <CardTitle>Simple Upload</CardTitle>
              <CardDescription>
                Just upload your flyer image and our AI extracts all event details automatically
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-white">
            How It Works
          </h2>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-500 text-lg font-bold text-deep-teal-950">
                1
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-white">Upload Your Flyer</h3>
                <p className="text-gray-300">
                  Drop your event flyer image (JPG or PNG). Our AI extracts event details instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-500 text-lg font-bold text-deep-teal-950">
                2
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-white">Review & Confirm</h3>
                <p className="text-gray-300">
                  Check the extracted details and make any needed adjustments before analysis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-500 text-lg font-bold text-deep-teal-950">
                3
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-white">Get Ranked Recommendations</h3>
                <p className="text-gray-300">
                  See top placement zones on an interactive map with transparent reasoning and risk warnings.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              onClick={() => navigate('/upload')}
              variant="outline"
              className="text-base"
            >
              Try It Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-deep-teal-800 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>OpenPlaces • Strategic Ad Placement for Arlington, VA</p>
        </div>
      </div>
    </div>
  )
}
