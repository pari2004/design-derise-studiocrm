import type { Metadata } from "next";
import { IMG } from "@/db/images";
import { LoginForm } from "./login-form";
import { LogoWordmark } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Sign in · DesignandDesireStudio" };

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Photographic background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${IMG.livingLuxury})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-cream/80 via-cream/60 to-sand/70 backdrop-blur-[2px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-glass-lg md:grid-cols-2">
          {/* Left — brand / imagery */}
          <div
            className="relative hidden min-h-[560px] flex-col justify-between p-10 md:flex"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(26,23,21,0.85), rgba(26,23,21,0.15)), url(${IMG.penthouse})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime shadow-lime">
                <span className="font-display text-lg font-bold text-charcoal">
                  D
                </span>
              </div>
              <span className="font-display text-sm font-semibold text-cream">
                DesignandDesireStudio
              </span>
            </div>
            <div>
              <p className="mb-2 inline-flex rounded-full bg-lime/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal">
                Interior Design CRM
              </p>
              <h2 className="font-display text-3xl font-bold leading-tight text-cream text-balance">
                Every project, every detail, beautifully organized.
              </h2>
              <p className="mt-3 max-w-sm text-sm text-cream/70">
                Manage enquiries, clients, moodboards, procurement, budgets and
                site execution — all in one premium creative workspace.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div className="flex flex-col justify-center gap-7 bg-cream/95 p-8 backdrop-blur-xl sm:p-12">
            <div className="md:hidden">
              <LogoWordmark />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal-text">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your creative workspace.
              </p>
            </div>

            <LoginForm />

            <div className="rounded-xl border border-lime/40 bg-lime/10 p-3.5 text-xs text-charcoal-text">
              <p className="font-semibold">Demo credentials</p>
              <p className="mt-1 text-muted-foreground">
                designanddesirestudio@gmail.com · Welcome@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
