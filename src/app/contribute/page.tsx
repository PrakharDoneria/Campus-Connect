
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shimmer } from '@/components/common/Shimmer';
import { Github, HandCoins, Code, ExternalLink, GitPullRequest } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GitHubIssue {
  id: number;
  html_url: string;
  title: string;
  number: number;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
}

async function getGitHubIssues(): Promise<GitHubIssue[]> {
  try {
    const response = await fetch('https://api.github.com/repos/PrakharDoneria/Campus-Connect/issues?state=open');
    if (!response.ok) {
      throw new Error('Failed to fetch issues from GitHub');
    }
    const issues = await response.json();
    return issues;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default function ContributePage() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const fetchedIssues = await getGitHubIssues();
      setIssues(fetchedIssues);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline">Contribute to Campus Connect</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Help us grow and improve the platform. Every contribution matters!
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Financial Support Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <HandCoins className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Support the Project</CardTitle>
                <CardDescription>Your donations help us cover server and maintenance costs.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white">
              <a href="https://www.paypal.com/paypalme/prakhardoneria" target="_blank" rel="noopener noreferrer">
                Donate with PayPal
              </a>
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold">Or use UPI:</p>
              <p className="text-lg font-mono p-2 bg-muted rounded-md mt-1">prakhardoneria@upi</p>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Contribution Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Github className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Contribute Code</CardTitle>
                <CardDescription>Found a bug or want a new feature? Help us out!</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button asChild className="w-full">
              <a href="https://github.com/PrakharDoneria/Campus-Connect" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
             <Button asChild variant="outline" className="w-full">
              <a href="https://github.com/PrakharDoneria/Campus-Connect/issues/new/choose" target="_blank" rel="noopener noreferrer">
                <GitPullRequest className="mr-2 h-4 w-4" />
                Create New Issue
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />
      
      {/* Open Issues Section */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Code />
          Open for Contribution
        </h2>
        <div className="space-y-4">
          {loading ? (
            <>
              <Shimmer className="h-24 w-full" />
              <Shimmer className="h-24 w-full" />
              <Shimmer className="h-24 w-full" />
            </>
          ) : issues.length > 0 ? (
            issues.map(issue => (
              <Card key={issue.id}>
                <CardContent className="p-4 flex justify-between items-start">
                  <div>
                    <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-primary transition-colors">
                      {issue.title}
                    </a>
                    <p className="text-sm text-muted-foreground mt-1">
                      # {issue.number} opened by {issue.user.login}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {issue.labels.map(label => (
                        <Badge key={label.name} variant="secondary" style={{ backgroundColor: `#${label.color}20`, color: `#${label.color}` }}>
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                   <Button asChild variant="ghost" size="icon">
                     <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                     </a>
                   </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No open issues right now. Feel free to create one!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
