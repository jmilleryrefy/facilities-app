import { signIn } from "@/lib/auth";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Facility Requests</CardTitle>
          <p className="text-gray-600 mt-2">Sign in to manage facility requests</p>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: "/my-requests" });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
              Sign in with Microsoft
            </Button>
          </form>
          <div className="mt-6 text-sm text-gray-600 text-center">
            <p>Only @yrefy.com, @investyrefy.com, and @invessio.com</p>
            <p>email addresses are allowed</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
