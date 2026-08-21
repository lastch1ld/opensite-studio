import { getAppSettings } from "@/lib/appSettings";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  const { appName } = getAppSettings();
  return <SignupForm appName={appName} />;
}
