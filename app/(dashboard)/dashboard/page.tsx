"use client";

import useAuthStore from "@/store/authStore";

export default function DashboardPage() {
  const { profile, role } = useAuthStore();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {profile?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">
          {role} Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Connections",   value: "—", color: "bg-green-50  text-green-800"  },
          { label: "Opportunities", value: "—", color: "bg-blue-50   text-blue-800"   },
          { label: "Notifications", value: "—", color: "bg-amber-50  text-amber-800"  },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${card.color.split(" ")[1]}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}