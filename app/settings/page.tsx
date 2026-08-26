import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { requireUser } from "../lib/auth";
import { getPublicSettings } from "../lib/settings";
import { SettingsForm } from "../components/SettingsForm";

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const settings = await getPublicSettings(user.id);
  return (
    <main>
      <Nav current="Settings" />
      <section className="container page-head">
        <p className="kicker">Settings</p>
        <h1>Your AI key</h1>
        <p className="lead">
          Connect your own AI provider for unlimited, private generation. Atom
          stays free either way.
        </p>
      </section>
      <section className="container section-sm">
        <SettingsForm initial={settings} />
      </section>
      <Footer />
    </main>
  );
}
