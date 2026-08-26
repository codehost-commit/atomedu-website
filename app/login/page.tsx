import { Footer } from "../components/Footer";
import { Nav } from "../components/Nav";
import { AuthForm } from "../components/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
    mode?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const hadLinkError =
    (typeof sp.error === "string" ? sp.error : "") === "link";
  const startSignup = (typeof sp.mode === "string" ? sp.mode : "") === "signup";
  return (
    <main>
      <style>{`.auth-wrap{max-width:1180px;margin:auto;padding:70px 28px 110px}.auth-linkerr{max-width:400px;margin:0 auto 16px;font-size:12px;color:#7f2114;background:#fdeeeb;border:1px solid #f3c7bf;padding:11px 13px;text-align:center}`}</style>
      <Nav current="" />
      <section className="auth-wrap">
        {hadLinkError && (
          <p className="auth-linkerr">
            That sign-in link was invalid or expired. Please request a new one.
          </p>
        )}
        <AuthForm next={next} startSignup={startSignup} />
      </section>
      <Footer />
    </main>
  );
}
