"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CreditCard, Plus } from "lucide-react";
import { checkAuth, type User } from "@/lib/auth";
import { getCreditBalance, topupCredits } from "@/lib/credits";
import { AuthGuard } from "@/components/AuthGuard";

export default function TopUpPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState<string>("10");
  const [topupLoading, setTopupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await checkAuth();
        if (!userData) {
          router.push("/");
          return;
        }
        
        setUser(userData);
        const balance = await getCreditBalance();
        setCurrentBalance(balance);
      } catch (error) {
        console.error('Failed to load user data:', error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  const handleTopup = async () => {
    setError(null);
    setSuccess(null);
    setTopupLoading(true);

    try {
      const amount = parseInt(topupAmount);
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      // In development, allow admin topup
      if (process.env.NODE_ENV === 'development') {
        await topupCredits(user?.id, undefined, amount);
        const newBalance = await getCreditBalance();
        setCurrentBalance(newBalance);
        setSuccess(`Successfully added ${amount} credits to your account!`);
      } else {
        // In production, this would integrate with a payment provider
        setError("Payment integration coming soon! For now, please contact support to add credits.");
      }
    } catch (error) {
      console.error('Topup failed:', error);
      setError("Failed to add credits. Please try again or contact support.");
    } finally {
      setTopupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A84FF]"></div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} redirectTo="/">
      <div className="min-h-screen bg-gradient-to-br from-[#0A84FF]/5 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto pt-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Top Up Credits</h1>
            <p className="text-neutral-600">Add credits to analyze more YouTube videos</p>
          </div>

          {/* Current Balance Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0A84FF] mb-2">
                {currentBalance} credits
              </div>
              <p className="text-sm text-neutral-600">
                Each analysis costs 1 credit
              </p>
            </CardContent>
          </Card>

          {/* Topup Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Credits
              </CardTitle>
              <CardDescription>
                Choose how many credits you'd like to add to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amount) => (
                  <Button
                    key={amount}
                    variant={topupAmount === amount.toString() ? "default" : "outline"}
                    onClick={() => setTopupAmount(amount.toString())}
                    className="h-12"
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <label htmlFor="custom-amount" className="text-sm font-medium text-neutral-700">
                  Custom Amount
                </label>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertTitle className="text-green-800">Success!</AlertTitle>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Topup Button */}
              <Button 
                onClick={handleTopup} 
                disabled={topupLoading}
                className="w-full h-12 bg-[#0A84FF] hover:bg-[#0b7aed]"
              >
                {topupLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  `Add ${topupAmount} Credits`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pricing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Packages</CardTitle>
              <CardDescription>
                Get more value with larger packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Starter</h4>
                  <p className="text-2xl font-bold text-[#0A84FF] mb-2">5 credits</p>
                  <p className="text-sm text-neutral-600">Perfect for trying out the service</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Popular</h4>
                  <p className="text-2xl font-bold text-[#0A84FF] mb-2">25 credits</p>
                  <p className="text-sm text-neutral-600">Great for regular analysis needs</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Pro</h4>
                  <p className="text-2xl font-bold text-[#0A84FF] mb-2">50 credits</p>
                  <p className="text-sm text-neutral-600">Best value for power users</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-1">Enterprise</h4>
                  <p className="text-2xl font-bold text-[#0A84FF] mb-2">100+ credits</p>
                  <p className="text-sm text-neutral-600">Custom packages available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => router.push("/analysis")}
              className="gap-2"
            >
              ← Back to Analysis
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
