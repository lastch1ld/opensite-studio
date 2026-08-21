import { getAppSettings } from "@/lib/appSettings";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const { appName } = getAppSettings();
  return <LoginForm appName={appName} />;
}
