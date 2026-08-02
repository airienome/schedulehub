import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Schedule<span className="text-blue-600">Hub</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Provider Login
            </Link>
            <a href="#contact" className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
            No patient app required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Your patients answer a call.<br />
            <span className="text-blue-600">We handle the rest.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            App-less appointment scheduling and reminder service for physical therapy referrals.
            Voice and SMS coordination so patients never need to download anything.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <a href="#how-it-works" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              See How It Works
            </a>
            <Link href="/login" className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Provider Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">The referral follow-through problem</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              A doctor prescribes physical therapy. Then what? Patients fall through the cracks
              between the prescription and the first appointment.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-2xl">📉</div>
              <h3 className="font-semibold">30% never start PT</h3>
              <p className="text-sm text-gray-500">
                Patients receive a referral and are told to &ldquo;call and schedule.&rdquo;
                Life gets in the way. They never call.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">📱</div>
              <h3 className="font-semibold">App fatigue</h3>
              <p className="text-sm text-gray-500">
                Every clinic has a portal. Every portal needs an account.
                Patients over 60 don&apos;t want another app.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">🔇</div>
              <h3 className="font-semibold">No adherence visibility</h3>
              <p className="text-sm text-gray-500">
                The prescribing doctor has no idea if PT is happening
                until the next office visit weeks later.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How ScheduleHub works</h2>
            <p className="text-gray-500 mt-3">Four steps. Zero apps for the patient.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: "🩺",
                title: "Doctor prescribes",
                desc: "Enter the PT order through our simple web form. Service type, frequency, duration. Takes 30 seconds.",
              },
              {
                step: "2",
                icon: "📞",
                title: "We call the patient",
                desc: "Our AI voice agent calls the patient in their preferred language. Collects address and availability by conversation.",
              },
              {
                step: "3",
                icon: "🗓️",
                title: "Match and book",
                desc: "We find in-network PT centers near the patient, match availability, and book the appointment. Patient confirms by voice or text.",
              },
              {
                step: "4",
                icon: "📊",
                title: "Track adherence",
                desc: "Automated reminders before each visit. No-shows trigger recovery outreach. The doctor gets progress reports and alerts.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">For prescribing doctors</h2>
            <ul className="space-y-4">
              {[
                "Passwordless login - sign in with a magic link, no passwords to manage",
                "Enter a PT order in 30 seconds from any device",
                "Real-time adherence dashboard: on track, at risk, fallen off",
                "Automated progress reports at re-evaluation intervals",
                "Alerts when patients miss consecutive sessions",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-blue-600 mt-0.5">&#10003;</span>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Access Provider Portal
            </Link>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold">For patients</h2>
            <ul className="space-y-4">
              {[
                "No app to download, no account to create, no portal to learn",
                "We call you in your language (English, Spanish, Haitian Creole)",
                "Tell us your schedule by voice - we do the matching",
                "Text confirmations and reminders before every visit",
                "Tap a link to see your appointments - expires after 30 minutes",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-emerald-600 mt-0.5">&#10003;</span>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-400 italic">
              Patients never need to visit this website.
            </p>
          </div>
        </div>
      </section>

      {/* Trust / compliance */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🔒", label: "HIPAA-ready audit logging" },
              { icon: "🌐", label: "Multilingual (EN, ES, HT)" },
              { icon: "📡", label: "Insurance network verification" },
              { icon: "🏥", label: "In-network PT matching" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="text-2xl">{item.icon}</div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to close the referral gap?</h2>
          <p className="text-gray-500">
            ScheduleHub connects the prescription to the first appointment
            without asking patients to do anything except answer the phone.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="mailto:hello@schedulehub.example"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Contact Us
            </a>
            <Link href="/login"
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Provider Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">
            ScheduleHub &mdash; App-less PT coordination
          </span>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/login">Provider Login</Link>
            <Link href="/admin">Staff Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
