/**
 * CBO Setup Page
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function CBOSetup() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-8 text-3xl font-bold">Organization Setup</h1>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Organization Profile</CardTitle>
          <CardDescription>
            Fill out your organization details to start receiving donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This form will help us verify your organization and create your profile.
          </p>
          <Button>Start Setup</Button>
        </CardContent>
      </Card>
    </div>
  )
}
