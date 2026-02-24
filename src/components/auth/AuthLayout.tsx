import { Briefcase, Users, Gift } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left column — form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 md:w-1/2 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-md">
          <h1 className="mb-8 font-display text-2xl font-bold text-foreground">
            Nestify
          </h1>
          {children}
        </div>
      </div>

      {/* Right column — decorative */}
      <div className="relative hidden overflow-hidden bg-foreground md:flex md:w-1/2 md:flex-col md:items-center md:justify-center md:p-12">
        {/* Orange blob */}
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary opacity-30 blur-[100px]" />

        <div className="relative z-10 max-w-sm text-center">
          <p className="mb-2 font-display text-lg font-bold text-primary-foreground/60">
            Nestify
          </p>
          <h2 className="mb-10 font-display text-3xl font-bold leading-tight text-primary-foreground">
            Tu carrera no tiene dirección fija. Tu comunidad sí.
          </h2>

          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground/70">
              <Briefcase className="h-4 w-4" /> Empleos remotos
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground/70">
              <Users className="h-4 w-4" /> Comunidad real
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground/70">
              <Gift className="h-4 w-4" /> Beneficios exclusivos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
