export function StatusHeader({ status }: { status: "alive" | "extinct" }) {
  const isAlive = status === "alive";

  return (
    <div className="flex flex-col items-center gap-1.5 mb-2">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isAlive ? "bg-primary animate-slow-pulse" : "bg-accent-red"
          }`}
        />
        <span className="text-[9px] tracking-[0.3em] uppercase text-text-muted">
          {isAlive ? "SYSTEM ACTIVE" : "SYSTEM OFFLINE"}
        </span>
      </div>
      <h1
        className={`text-lg md:text-xl font-bold tracking-[0.2em] uppercase ${
          isAlive ? "text-primary glow-primary" : "text-accent-red glow-red"
        }`}
      >
        HUMANITY STATUS
      </h1>
    </div>
  );
}
