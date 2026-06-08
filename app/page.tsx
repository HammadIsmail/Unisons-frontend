import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  MessageCircle,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#0f2d5c] text-white">
        <span className="text-lg font-extrabold">U</span>
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-[#0f2d5c]">
        UNISON
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------
function Nav() {
  const links = [
    { label: "About Us", href: "#about" },
    { label: "Opportunities", href: "#about" },
    { label: "Account Creation", href: "#account" },
    { label: "Login", href: "#join" },
  ];

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
        <Logo />
        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-[#0f2d5c] transition-colors hover:text-[#3b9edd]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="hidden rounded-full bg-[#0f2d5c] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 md:inline-block"
        >
          Login
        </Link>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <img
        src="/grad.png"
        alt="Students and alumni connecting on UNISON"
        className="absolute inset-0 w-full h-full object-cover object-top opacity-[0.12] z-0"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-12 lg:pb-32">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#dbeeff] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#0f2d5c]">
          Students × Alumni
        </span>
        <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] text-[#0f2d5c] sm:text-6xl lg:text-7xl">
          <span className="block text-[#3b9edd]">CONNECT.</span>
          <span className="block">LEARN. GROW.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
          UNISON is the professional network built exclusively to bridge
          students and alumni. Find mentors, discover opportunities, and shape
          your future with the people who&apos;ve walked your path.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="rounded-full bg-[#0f2d5c] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-xl transition-transform hover:scale-105"
          >
            Join Now
          </Link>
          <Link
            href="#account"
            className="rounded-full border-2 border-[#0f2d5c] px-8 py-4 text-sm font-bold uppercase tracking-wider text-[#0f2d5c] transition-colors hover:bg-[#0f2d5c] hover:text-white"
          >
            How it Works
          </Link>
        </div>
        <div className="mt-10 flex items-center gap-6">
          <div className="flex -space-x-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-[#3b9edd] to-[#0f2d5c]"
              />
            ))}
          </div>
          <p className="text-sm text-slate-500">
            
            students &amp; alumni connected
          </p>
        </div>
      </div>
    </section>
  );
}
// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------
function Features() {
  const features = [
    {
      icon: Users,
      title: "Connect with Alumni",
      desc: "Follow alumni from your university and build relationships that last a career.",
    },
    {
      icon: Briefcase,
      title: "Real Opportunities",
      desc: "Jobs, internships, and scholarships posted by alumni and partners who want you to succeed.",
    },
    {
      icon: MessageCircle,
      title: "Direct Messaging",
      desc: "Skip the cold outreach. Message mentors and peers directly inside UNISON.",
    },
    {
      icon: GraduationCap,
      title: "Mentorship",
      desc: "Get advice from people who studied where you study and work where you want to.",
    },
    {
      icon: Trophy,
      title: "Events & Workshops",
      desc: "Join alumni-hosted events, workshops, and meetups.",
    },
    {
      icon: Sparkles,
      title: "Build Your Network",
      desc: "Expand your circle with verified students and alumni — no noise, just signal.",
    },
  ];

  return (
    <section id="about" className="bg-[#dbeeff]/40 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#3b9edd]">
            What we do
          </span>
          <h2 className="mt-3 text-4xl font-bold text-[#0f2d5c] sm:text-5xl">
            Everything you need to launch your career
          </h2>
          <p className="mt-4 text-slate-500">
            One platform. Two communities. Endless possibilities.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:border-[#3b9edd] hover:shadow-xl"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-[#dbeeff] text-[#0f2d5c] transition-colors group-hover:bg-[#0f2d5c] group-hover:text-white">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0f2d5c]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HowItWorks
// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Create your profile",
      desc: "Signup and wait for the admins to approve your account.",
    },
    {
      n: "02",
      title: "Discover your people",
      desc: "Browse alumni in your field, follow them, and start conversations.",
    },
    {
      n: "03",
      title: "Apply & grow",
      desc: "Apply to alumni-posted roles, join events, and land your next chapter.",
    },
  ];

  return (
    <section id="account" className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3b9edd]">
              How it works
            </span>
            <h2 className="mt-3 text-4xl font-bold text-[#0f2d5c] sm:text-5xl">
              From classroom to career in three steps.
            </h2>
            <p className="mt-4 text-slate-500">
              UNISON removes the friction between knowing where you want to go
              and meeting the people who can take you there.
            </p>
          </div>
          <div className="space-y-6">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex gap-6 rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="text-4xl font-extrabold text-[#3b9edd]">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0f2d5c]">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------
function CTA() {
  return (
    <section
      id="join"
      className="relative overflow-hidden bg-[#0f2d5c] py-24 text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px, 80px 80px",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-4xl font-bold sm:text-5xl">
          Your future is one connection away.
        </h2>
        <p className="mt-4 text-white/80">
          Join students and alumni already building something together
          on UNISON.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="rounded-full border-2 border-white px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-[#0f2d5c]"
          >
            Create Your Account
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-12">
        <Logo />
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} UNISON. Built for students and alumni.
        </p>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Landing (default export)
// ---------------------------------------------------------------------------
export default function Landing() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}
