import { Link } from "react-router-dom";
import { DashboardCards } from "./DashboardCards";
import { MyMoves } from "../components/moves/MyMoves";
import { BalanceDashboard } from "./BalanceDashboard";

export function UserDashboard() {
  return (
    <div className="space-y-8">
      {/* Overview / stats */}
      <DashboardCards />

      {/* Primary CTA */}
      <div className="flex justify-end">
        <Link
          to="/booking"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Move Request
        </Link>
      </div>

      {/* My Moves */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">My Moves</h2>
        <MyMoves />
      </section>

      {/* Payments / balance */}
      <BalanceDashboard />
    </div>
  );
}
