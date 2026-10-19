import { currentUser } from "@/lib/session-user";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader() {
  const user = await currentUser();
  return (
    <SiteHeaderClient
      signedIn={Boolean(user)}
      isLandlord={user?.role === "landlord"}
      rentalManagementEnabled={Boolean(user) && process.env.ENABLE_RENTAL_MANAGEMENT === "true"}
    />
  );
}
