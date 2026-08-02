import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            PT Referral Orchestration &mdash; Proof of Concept
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Webapp-less patient coordination. Doctor prescribes, system calls, patient speaks, appointment confirmed.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/doctor"
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="text-2xl mb-2">🩺</div>
            <h2 className="font-semibold text-lg">Doctor</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create PT orders, view patient adherence reports
            </p>
          </Link>

          <Link
            href="/admin"
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
          >
            <div className="text-2xl mb-2">📋</div>
            <h2 className="font-semibold text-lg">Coordinator</h2>
            <p className="text-sm text-gray-500 mt-1">
              Order pipeline, matching status, outreach log
            </p>
          </Link>

          <Link
            href="/patient"
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
          >
            <div className="text-2xl mb-2">📱</div>
            <h2 className="font-semibold text-lg">Patient View</h2>
            <p className="text-sm text-gray-500 mt-1">
              Call log, appointment status (demo observer view)
            </p>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400">
          All data is fictional. No real PHI. Miami-Dade demo scenario.
        </p>
      </main>
    </div>
  );
}
