import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-container">
      <div className="card">

        <h1>LMS Portal</h1>

        <p>
          Learn Better. Practice More.
        </p>

        <div className="button-group">

          <Link href="/login">
            <button>Login</button>
          </Link>

          <Link href="/register">
            <button>Register</button>
          </Link>

        </div>

      </div>
    </div>
  );
}