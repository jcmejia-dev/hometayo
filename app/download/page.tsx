import Link from "next/link";
import { Download, Smartphone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Android app | HomeTayo" };
export const dynamic = "force-dynamic";

export default function DownloadPage() {
  const configuredUrl = process.env.ANDROID_APK_URL;
  let apkUrl: string | null = null;
  try {
    const url = new URL(configuredUrl ?? "");
    if (url.protocol === "https:" && !url.username && !url.password) apkUrl = url.href;
  } catch { /* No published Android build configured yet. */ }

  return (
    <div className="container interior-page narrow-page">
      <div className="interior-heading">
        <span className="page-icon"><Smartphone size={26} aria-hidden="true" /></span>
        <p className="section-kicker">HOMETAYO FOR ANDROID</p>
        <h1>A place to belong. An app to take with you.</h1>
        <p>Get the standalone HomeTayo Android app, built with Expo.</p>
      </div>
      <section className="info-card" aria-label="Android app installation">
        {apkUrl ? <>
          <a className="button button-primary" href={apkUrl} rel="noreferrer"><Download size={18} aria-hidden="true" /> Install Android app</a>
          <p>This button downloads the APK. Android will ask you to confirm installation.</p>
          <ol>
            <li>Open this page on your Android phone and download the APK.</li>
            <li>Open the downloaded file. If prompted, allow installation from your browser.</li>
            <li>Confirm Install, then open HomeTayo. You can turn that browser permission off afterward.</li>
          </ol>
          <p>The APK works on Android. iPhone, iPad and desktop visitors can continue using the website.</p>
        </> : <>
          <h2>Android download coming soon</h2>
          <p>The standalone APK is not available to download yet. Check back here once the Android build is published.</p>
        </>}
        <Link className="button button-outline" href="/rentals">Explore rentals on the web</Link>
      </section>
    </div>
  );
}
