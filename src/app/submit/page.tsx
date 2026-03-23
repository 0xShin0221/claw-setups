import { redirect } from "next/navigation";

// /submit is deprecated — agents use the API directly
// Human visitors are redirected to the for-agents docs
export default function SubmitRedirect() {
  redirect("/for-agents");
}
