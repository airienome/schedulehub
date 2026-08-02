import Link from "next/link";

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg width="22" height="20" viewBox="0 0 24 22" fill="none" className={className}>
      <defs>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ab65ba" />
          <stop offset="0.5" stopColor="#b2cfee" />
          <stop offset="1" stopColor="#ee0d63" />
        </linearGradient>
      </defs>
      <path d="M12 21C12 21 1 14.1 1 7.3C1 3.8 3.7 1.5 6.8 1.5C9 1.5 10.9 2.8 12 4.8C13.1 2.8 15 1.5 17.2 1.5C20.3 1.5 23 3.8 23 7.3C23 14.1 12 21 12 21Z" fill="url(#heartGrad)" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <nav className="border-b border-warm-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.png" alt="TherapyFlow" className="h-8" />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-warm-600 hover:text-warm-900">
              Provider Login
            </Link>
            <a href="#contact" className="text-sm px-5 py-2 bg-sky text-warm-800 font-semibold rounded-full hover:bg-sky-dark transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white via-blush to-warm-50 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-lavender/15 text-lavender text-xs font-semibold rounded-full">
            <span>&#9679;</span> No patient app required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight text-warm-900">
            Your patients answer a call.<br />
            <span className="text-pink">We handle the rest.</span>
          </h1>
          <p className="text-xl text-warm-500 max-w-2xl mx-auto">
            App-less appointment scheduling and reminder service for physical therapy referrals.
            Voice and SMS coordination so patients never need to download anything.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <a href="#how-it-works" className="px-7 py-3 bg-sky text-warm-800 rounded-full font-semibold hover:bg-sky-dark transition-colors">
              See How It Works
            </a>
            <Link href="/login" className="px-7 py-3 border border-warm-300 rounded-full font-semibold text-warm-600 hover:bg-white transition-colors">
              Provider Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-warm-900">The referral follow-through problem</h2>
            <p className="text-warm-500 mt-3 max-w-2xl mx-auto">
              A doctor prescribes physical therapy. Then what? Patients fall through the cracks
              between the prescription and the first appointment.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-peach/30 flex items-center justify-center text-2xl">📉</div>
              <h3 className="font-semibold text-warm-800">30% never start PT</h3>
              <p className="text-sm text-warm-500">
                Patients receive a referral and are told to &ldquo;call and schedule.&rdquo;
                Life gets in the way. They never call.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-lavender/15 flex items-center justify-center text-2xl">📱</div>
              <h3 className="font-semibold text-warm-800">App fatigue</h3>
              <p className="text-sm text-warm-500">
                Every clinic has a portal. Every portal needs an account.
                Patients over 60 don&apos;t want another app.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-sky/30 flex items-center justify-center text-2xl">🔇</div>
              <h3 className="font-semibold text-warm-800">No adherence visibility</h3>
              <p className="text-sm text-warm-500">
                The prescribing doctor has no idea if PT is happening
                until the next office visit weeks later.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-warm-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-warm-900">How TherapyFlow works</h2>
            <p className="text-warm-500 mt-3">Four steps. Zero apps for the patient.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1", color: "bg-sky", textColor: "text-warm-800",
                icon: "🩺", title: "Doctor prescribes",
                desc: "Enter the PT order through our simple web form. Service type, frequency, duration. Takes 30 seconds.",
              },
              {
                step: "2", color: "bg-lavender", textColor: "text-white",
                icon: "📞", title: "We call the patient",
                desc: "Our AI voice agent calls the patient in their preferred language. Collects address and availability by conversation.",
              },
              {
                step: "3", color: "bg-peach", textColor: "text-warm-800",
                icon: "🗓️", title: "Match and book",
                desc: "We find in-network PT centers near the patient, match availability, and book the appointment.",
              },
              {
                step: "4", color: "bg-olive", textColor: "text-white",
                icon: "📊", title: "Track adherence",
                desc: "Automated reminders before each visit. No-shows trigger recovery outreach. The doctor gets progress reports.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-warm-200 p-6 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full ${item.color} ${item.textColor} text-sm font-bold flex items-center justify-center`}>
                    {item.step}
                  </span>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h3 className="font-semibold text-warm-800">{item.title}</h3>
                <p className="text-sm text-warm-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-warm-900">For prescribing doctors</h2>
            <ul className="space-y-4">
              {[
                "Passwordless login - sign in with a magic link, no passwords to manage",
                "Enter a PT order in 30 seconds from any device",
                "Real-time adherence dashboard: on track, at risk, fallen off",
                "Automated progress reports at re-evaluation intervals",
                "Alerts when patients miss consecutive sessions",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-olive mt-0.5 font-bold">&#10003;</span>
                  <span className="text-warm-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="inline-block px-6 py-2.5 bg-sky text-warm-800 rounded-full text-sm font-semibold hover:bg-sky-dark transition-colors">
              Access Provider Portal
            </Link>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-warm-900">For patients</h2>
            <ul className="space-y-4">
              {[
                "No app to download, no account to create, no portal to learn",
                "We call you in your language (English, Spanish, Haitian Creole)",
                "Tell us your schedule by voice - we do the matching",
                "Text confirmations and reminders before every visit",
                "Tap a link to see your appointments - expires after 30 minutes",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-pink mt-0.5 font-bold">&#10003;</span>
                  <span className="text-warm-600">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-warm-400 italic">
              Patients never need to visit this website.
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-6 bg-blush border-y border-warm-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🔒", label: "HIPAA-ready audit logging" },
              { icon: "🌐", label: "Multilingual (EN, ES, HT)" },
              { icon: "📡", label: "Insurance verification" },
              { icon: "🏥", label: "In-network PT matching" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="text-2xl">{item.icon}</div>
                <p className="text-sm font-semibold text-warm-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-warm-900">Ready to close the referral gap?</h2>
          <p className="text-warm-500">
            TherapyFlow connects the prescription to the first appointment
            without asking patients to do anything except answer the phone.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="mailto:hello@therapyflow305.example"
              className="px-7 py-3 bg-pink text-white rounded-full font-semibold hover:bg-pink-dark transition-colors">
              Contact Us
            </a>
            <Link href="/login"
              className="px-7 py-3 border border-warm-300 rounded-full font-semibold text-warm-600 hover:bg-warm-50 transition-colors">
              Provider Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 bg-white py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/logo.png" alt="TherapyFlow 305" className="h-5" />
          <div className="flex gap-6 text-sm text-warm-400">
            <Link href="/login" className="hover:text-warm-600">Provider Login</Link>
            <Link href="/centers" className="hover:text-warm-600">PT Centers</Link>
            <Link href="/admin" className="hover:text-warm-600">Staff Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
