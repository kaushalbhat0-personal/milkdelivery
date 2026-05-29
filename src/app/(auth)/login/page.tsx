import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">DeliveryFlow</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>
      <LoginForm />
    </div>
  );
}
