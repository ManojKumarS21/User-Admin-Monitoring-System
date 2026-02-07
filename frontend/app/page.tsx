export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">

      <div className="card w-[520px] text-center">

        <h1 className="mb-3">🚀 Dashboard System</h1>

        <p className="text-gray-400 mb-6">
          Welcome to your modern, secure authentication portal
        </p>

        <div className="flex justify-center gap=6 mb-6">
          <a href="/login">
            <button className="px-10"> Login </button>
          </a>

          <a href="/register">
            <button className="btn-secondary px-10"> Register </button>
          </a>
        </div>

        <p className="text-sm text-gray-400">
          ✓ Secure Authentication &nbsp;
          ✓ Real-time Updates &nbsp;
          ✓ Admin Dashboard
        </p>

      </div>

    </main>
  );
}
