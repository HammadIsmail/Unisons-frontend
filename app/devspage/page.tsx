"use client";

import Image from "next/image";

const devs = [
  {
    name: "Zain Ul Abideen",
    role: "github.com/ZainUlAbideen-01",
    image: "/dev1.jpeg",
    bio: "Currently arguing with a bug at 4.30 AM. Sleep is a future problem",
    tag: "Frontend Dev",
  },
  {
    name: "Hammad Ismail",
    role: "github.com/HammadIsmail",
    image: "/dev2.jpeg",
    bio: "Ask anything and Hammad will probably know something about it.",
    tag: "Backend Dev",
  },
  {
    name: "Asim Ayub",
    role: "github.com/muhamadasim",
    image: "/dev3.jpeg",
    bio: "Lazy guy but will get the work done ",
    tag: "App Dev",
  },
];

export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-[#09090f] text-white flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#1a3a8f]/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-80px] left-1/4 w-[300px] h-[300px] rounded-full bg-[#1a3a8f]/10 blur-[100px]" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <p className="text-xs tracking-[0.35em] uppercase text-[#4a6cf7] mb-4 font-medium">
          you found it
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Built by humans,
          <br />
          <span className="text-[#4a6cf7]">for humans.</span>
        </h1>
        <p className="text-[#6b7280] text-sm max-w-sm mx-auto leading-relaxed">
          This platform was designed, developed, and debugged by three people only.
        </p>
      </div>

      {/* Dev Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl relative z-10">
        {devs.map((dev, i) => (
          <div
            key={i}
            className="group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col items-center text-center hover:border-[#4a6cf7]/40 hover:bg-white/[0.05] transition-all duration-300"
          >
            {/* Tag */}
            <span className="absolute top-4 right-4 text-[10px] tracking-widest uppercase text-[#4a6cf7]/70 font-semibold">
              {dev.tag}
            </span>

            {/* Avatar */}
            <div className="relative mb-5 mt-2">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-[#4a6cf7]/50 transition-all duration-300">
                <Image
                  src={dev.image}
                  alt={dev.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
              {/* Subtle glow behind avatar on hover */}
              <div className="absolute inset-0 rounded-full bg-[#4a6cf7]/20 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10" />
            </div>

            {/* Info */}
            <h2 className="text-white font-semibold text-lg mb-0.5">{dev.name}</h2>
            <p className="text-[#4a6cf7] text-xs font-medium tracking-wide mb-4">
              {dev.role}
            </p>
            <p className="text-[#9ca3af] text-sm leading-relaxed">{dev.bio}</p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-16 text-[#374151] text-xs tracking-wide relative z-10">
        UNISON · Made with too much sleepless nights ·{" "}
        <span className="text-[#4a6cf7]/60">2026</span>
      </p>
    </main>
  );
}
