import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Flame,
  Focus,
  GraduationCap,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: NotebookPen,
    title: "Notes that think with you.",
    description:
      "Capture ideas, organize nested pages, and let AI summarize, rewrite, fix grammar, expand notes, or create flashcards.",
    tags: ["AI NOTES", "FLASHCARDS", "SMART SEARCH"],
    color: "bg-[#FFF0A8]",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "Your semester, under control.",
    description:
      "Plan assignments, track deadlines, prioritize tasks, and turn your syllabus PDF into an actionable study plan.",
    tags: ["TASKS", "CALENDAR", "KANBAN"],
    color: "bg-[#DCE8D5]",
  },
  {
    number: "03",
    icon: Flame,
    title: "Small habits. Real progress.",
    description:
      "Build routines, maintain streaks, complete daily challenges, and earn XP every time you show up.",
    tags: ["HABITS", "STREAKS", "XP & LEVELS"],
    color: "bg-[#F8DCD0]",
  },
  {
    number: "04",
    icon: Focus,
    title: "Get in the zone.",
    description:
      "Use customizable Pomodoro sessions, distraction-free focus mode, and ambient sounds to stay on track.",
    tags: ["POMODORO", "FOCUS MODE", "LO-FI"],
    color: "bg-[#DED8F5]",
  },
  {
    number: "05",
    icon: Wallet,
    title: "Make your money make sense.",
    description:
      "Track expenses and income, set budget limits, split bills with friends, and understand your spending.",
    tags: ["BUDGETS", "EXPENSES", "INSIGHTS"],
    color: "bg-[#D9E9F7]",
  },
  {
    number: "06",
    icon: Users,
    title: "Better together.",
    description:
      "Create study groups, share goals, keep each other accountable, and work together in virtual Study Rooms.",
    tags: ["STUDY ROOMS", "SHARED GOALS", "TEAMWORK"],
    color: "bg-[#E7E6B9]",
  },
];

const tasks = [
  { title: "Revise Data Structures", time: "09:00 AM", done: true },
  { title: "Complete DBMS assignment", time: "12:30 PM", done: false },
  { title: "Physics chapter 04", time: "04:00 PM", done: false },
];

function SectionLabel({ children }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-3 w-3 border-2 border-black bg-[#FFE500]" />
      <span className="text-xs font-black uppercase tracking-[0.18em]">
        {children}
      </span>
    </div>
  );
}

function ActionLink({ href, children, secondary = false }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 border-2 border-black px-5 py-3 text-sm font-black transition-all duration-150 ${
        secondary
          ? "bg-[#F7F4EC] text-black hover:bg-white"
          : "bg-[#FFE500] text-black shadow-[4px_4px_0_#111] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
      }`}
    >
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[550px]">
      <div className="absolute -right-2 -top-2 z-10 rotate-3 border-2 border-black bg-[#FFE500] px-4 py-2 text-xs font-black shadow-[3px_3px_0_#111] sm:-right-5">
        YOUR SPACE. YOUR RULES.
      </div>

      <div className="border-[3px] border-black bg-white shadow-[8px_8px_0_#111] sm:shadow-[12px_12px_0_#111]">
        <div className="flex items-center justify-between border-b-[3px] border-black bg-[#F7F4EC] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center border-2 border-black bg-[#FFE500]">
              <GraduationCap size={18} />
            </div>
            <span className="text-sm font-black">MY WORKSPACE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-black bg-[#FF8175]" />
            <span className="h-2.5 w-2.5 rounded-full border border-black bg-[#FFE500]" />
            <span className="h-2.5 w-2.5 rounded-full border border-black bg-[#8FCF8A]" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[125px_1fr]">
          <aside className="hidden border-r-2 border-black bg-[#F7F4EC] p-3 sm:block">
            <div className="mb-5 flex items-center gap-2 bg-[#FFE500] p-2 text-xs font-black">
              <LayoutDashboard size={15} />
              Overview
            </div>
            {[
              [NotebookPen, "My notes"],
              [CalendarDays, "My tasks"],
              [Target, "Habits"],
              [Wallet, "My money"],
              [Users, "Study group"],
            ].map(([Icon, label]) => (
              <div
                key={label}
                className="mb-4 flex items-center gap-2 text-xs font-bold text-zinc-600"
              >
                <Icon size={14} />
                {label}
              </div>
            ))}
          </aside>

          <div className="min-w-0 p-4 sm:p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-bold text-zinc-500">
                  MONDAY, YOUR NEXT CHAPTER
                </p>
                <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Let&apos;s get
                  <br />
                  things done<span className="text-[#D5B900]">.</span>
                </h3>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center border-2 border-black bg-[#DED8F5]">
                <Sparkles size={20} />
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="border-2 border-black bg-[#FFF0A8] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <NotebookPen size={18} />
                  <ArrowUpRight size={15} />
                </div>
                <p className="text-2xl font-black">12</p>
                <p className="text-xs font-bold">Notes created</p>
              </div>
              <div className="border-2 border-black bg-[#DCE8D5] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Flame size={18} />
                  <span className="text-xs font-black">+1</span>
                </div>
                <p className="text-2xl font-black">7 days</p>
                <p className="text-xs font-bold">Sample streak</p>
              </div>
            </div>

            <div className="border-2 border-black">
              <div className="flex items-center justify-between border-b-2 border-black bg-[#F7F4EC] px-3 py-2.5">
                <span className="text-xs font-black">TODAY&apos;S PLAN</span>
                <span className="text-xs font-bold">3 tasks</span>
              </div>
              {tasks.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center gap-3 border-b border-zinc-200 px-3 py-3 last:border-b-0"
                >
                  <div
                    className={`grid h-5 w-5 shrink-0 place-items-center border-2 border-black ${
                      task.done ? "bg-[#FFE500]" : "bg-white"
                    }`}
                  >
                    {task.done && <Check size={13} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs font-bold ${
                        task.done ? "text-zinc-400 line-through" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-zinc-500">
                      {task.time}
                    </p>
                  </div>
                  {!task.done && (
                    <ChevronRight size={15} className="shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 border-2 border-black bg-[#DED8F5] p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center border-2 border-black bg-white">
                <Brain size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black">Let AI help you out.</p>
                <p className="text-[10px] font-medium">
                  Notes into flashcards, in seconds.
                </p>
              </div>
              <Sparkles size={18} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t-[3px] border-black bg-[#FFE500] px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap size={17} />
            <span className="text-xs font-black">
              ONE SPACE. MORE PROGRESS.
            </span>
          </div>
          <span className="hidden text-[10px] font-bold sm:block">
            SAMPLE PREVIEW
          </span>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-2 -z-10 h-20 w-20 bg-[#DCE8D5] sm:-left-5" />
    </div>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <article className="group flex h-full flex-col border-2 border-black bg-[#F7F4EC] transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0_#111]">
      <div
        className={`flex items-center justify-between border-b-2 border-black p-5 ${feature.color}`}
      >
        <div className="grid h-12 w-12 place-items-center border-2 border-black bg-white">
          <Icon size={23} strokeWidth={2.2} />
        </div>
        <span className="text-xs font-black">{feature.number} / 06</span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="max-w-sm text-2xl font-black leading-tight tracking-tight">
          {feature.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-zinc-700">
          {feature.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className="border border-black px-2 py-1 text-[9px] font-black tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t-2 border-black px-5 py-3">
        <span className="text-xs font-black uppercase">Explore the idea</span>
        <ArrowDownRight
          size={18}
          className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1"
        />
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F4EC] text-[#111111] selection:bg-[#FFE500] selection:text-black">
      {/* Navigation */}
      <header className="border-b-2 border-black">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center border-2 border-black bg-[#FFE500] text-xl font-black">
              F
            </span>
            <span className="text-xl font-black tracking-tight">
              FRIDAY<span className="text-[#B69D00]">.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-bold hover:underline">
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-bold hover:underline"
            >
              How it works
            </a>
            <a
              href="#study-together"
              className="text-sm font-bold hover:underline"
            >
              Study together
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-black hover:underline sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 border-2 border-black bg-[#FFE500] px-3 py-2.5 text-xs font-black shadow-[3px_3px_0_#111] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none sm:px-4 sm:text-sm"
            >
              Get started <ArrowUpRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2">
            <Sparkles size={15} />
            <span className="text-[10px] font-black tracking-[0.12em] sm:text-xs">
              YOUR ALL-IN-ONE STUDENT WORKSPACE
            </span>
          </div>

          <h1 className="text-[clamp(3.5rem,8vw,6.8rem)] font-black leading-[0.84] tracking-[-0.075em]">
            GET YOUR
            <br />
            LIFE
            <br />
            TOGETHER<span className="text-[#C4AA00]">.</span>
          </h1>

          <div className="mt-8 max-w-lg border-l-[5px] border-[#FFE500] pl-5">
            <p className="text-lg font-bold leading-8 sm:text-xl">
              One space for your notes, deadlines, habits, money, and people.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
              College is already chaotic. Your productivity system
              shouldn&apos;t be. Plan smarter, focus better, and make progress
              that actually feels good.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <ActionLink href="/signup">Build your workspace</ActionLink>
            <a
              href="#features"
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-black px-5 py-3 text-sm font-black transition-colors hover:bg-white"
            >
              See what&apos;s inside <ArrowDownRight size={17} />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-zinc-600">
            <span className="flex items-center gap-1.5">
              <CheckCheck size={15} /> One organized space
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCheck size={15} /> AI-powered tools
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCheck size={15} /> Study with friends
            </span>
          </div>
        </div>

        <DashboardPreview />
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y-[3px] border-black bg-[#FFE500] py-4">
        <div className="flex min-w-max items-center justify-around gap-8 px-5 text-sm font-black tracking-[0.12em] sm:text-base">
          <span>TAKE NOTES.</span>
          <span>✳</span>
          <span>PLAN YOUR SEMESTER.</span>
          <span>✳</span>
          <span>BUILD BETTER HABITS.</span>
          <span>✳</span>
          <span>FOCUS DEEPER.</span>
          <span>✳</span>
          <span>LEVEL UP.</span>
          <span>✳</span>
          <span>STUDY TOGETHER.</span>
          <span>✳</span>
        </div>
      </div>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-7xl scroll-mt-10 px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
      >
        <div className="mb-12 grid gap-6 md:grid-cols-[1fr_0.65fr] md:items-end">
          <div>
            <SectionLabel>Everything in one place</SectionLabel>
            <h2 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              LESS CHAOS.
              <br />
              MORE <span className="bg-[#FFE500] px-2">PROGRESS.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-zinc-600 md:justify-self-end">
            Six connected tools designed around real student life. No need to
            jump between a dozen apps just to get through the week.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.number} feature={feature} />
          ))}
        </div>
      </section>

      {/* AI spotlight */}
      <section
        id="how-it-works"
        className="scroll-mt-10 border-y-[3px] border-black bg-[#DED8F5]"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:px-12">
          <div>
            <SectionLabel>Meet your AI study buddy</SectionLabel>
            <h2 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              FROM
              <br />
              OVERWHELMED
              <br />
              TO{" "}
              <span className="underline decoration-[#FFE500] decoration-[8px] underline-offset-4">
                ON TRACK.
              </span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-zinc-700">
              Got a huge syllabus? Messy notes? An exam coming up? Use AI to
              turn the stuff in your head into something you can actually work
              with.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Turn notes into clear summaries.",
                "Generate flashcards for revision.",
                "Rewrite and improve your writing.",
                "Break syllabus topics into planned tasks.",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="grid h-6 w-6 shrink-0 place-items-center border-2 border-black bg-[#FFE500]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-bold">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-9">
              <ActionLink href="/signup">Give it a try</ActionLink>
            </div>
          </div>

          <div className="border-[3px] border-black bg-white shadow-[8px_8px_0_#111] sm:shadow-[12px_12px_0_#111]">
            <div className="flex items-center gap-3 border-b-[3px] border-black bg-[#F7F4EC] p-4">
              <div className="grid h-10 w-10 place-items-center border-2 border-black bg-[#FFE500]">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-black">AI NOTE ASSISTANT</p>
                <p className="text-xs font-bold text-zinc-500">
                  A sample workflow
                </p>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-7">
              <div className="border-2 border-black bg-[#F7F4EC] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={17} />
                  <span className="text-xs font-black">YOUR LECTURE NOTES</span>
                </div>
                <p className="text-sm leading-6 text-zinc-600">
                  Data structures organize information so it can be accessed and
                  modified efficiently. Arrays store elements in contiguous
                  memory...
                </p>
              </div>

              <div className="flex justify-center">
                <div className="flex items-center gap-2 border-2 border-black bg-[#FFE500] px-4 py-2 text-xs font-black">
                  <Sparkles size={15} /> TRANSFORM WITH AI
                  <ArrowDownRight size={15} />
                </div>
              </div>

              <div className="border-2 border-black p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Brain size={18} />
                  <span className="text-xs font-black">
                    YOUR STUDY MATERIAL
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-black bg-[#DCE8D5] text-xs font-black">
                      1
                    </span>
                    <div>
                      <p className="text-sm font-black">Quick summary</p>
                      <p className="text-xs leading-5 text-zinc-600">
                        A shorter, clearer explanation of the topic.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-black bg-[#FFF0A8] text-xs font-black">
                      2
                    </span>
                    <div>
                      <p className="text-sm font-black">Flashcards</p>
                      <p className="text-xs leading-5 text-zinc-600">
                        Question-and-answer cards for revision.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center border border-black bg-[#DED8F5] text-xs font-black">
                      3
                    </span>
                    <div>
                      <p className="text-sm font-black">Actionable tasks</p>
                      <p className="text-xs leading-5 text-zinc-600">
                        Turn learning goals into manageable steps.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] font-bold text-zinc-400">
                CONCEPT PREVIEW · AI FEATURES REQUIRE IMPLEMENTATION
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionLabel>Progress you can feel</SectionLabel>
            <h2 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              MAKE
              <br />
              CONSISTENCY
              <br />
              YOUR <span className="bg-[#FFE500] px-2">SUPERPOWER.</span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-zinc-600 sm:text-base">
              You don&apos;t need to be productive every second. You just need a
              system that helps you keep showing up. Track streaks, set
              challenges, and celebrate the small wins.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-black bg-[#FFF0A8] p-5 sm:p-7">
              <Flame size={28} />
              <p className="mt-8 text-3xl font-black sm:text-5xl">7 DAYS</p>
              <p className="mt-2 text-xs font-black uppercase">
                Example streak
              </p>
              <div className="mt-5 flex gap-1.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div
                    key={`${day}-${i}`}
                    className={`grid h-7 min-w-0 flex-1 place-items-center border border-black text-[10px] font-black ${i < 5 ? "bg-[#FFE500]" : "bg-white"}`}
                  >
                    {i < 5 ? <Check size={12} /> : day}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-black bg-[#DCE8D5] p-5 sm:p-7">
              <Zap size={28} />
              <p className="mt-8 text-3xl font-black sm:text-5xl">+250 XP</p>
              <p className="mt-2 text-xs font-black uppercase">
                Example reward
              </p>
              <div className="mt-6 h-3 border-2 border-black bg-white">
                <div className="h-full w-3/4 border-r-2 border-black bg-[#8CCF82]" />
              </div>
              <p className="mt-2 text-[10px] font-bold">
                LEVEL UP YOUR ROUTINE
              </p>
            </div>

            <div className="col-span-2 border-2 border-black bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-zinc-500">
                    Your daily challenge
                  </p>
                  <p className="mt-2 text-lg font-black sm:text-2xl">
                    Finish one thing that matters.
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Study, organize, focus, or build a habit.
                  </p>
                </div>
                <div className="grid h-14 w-14 shrink-0 place-items-center border-2 border-black bg-[#DED8F5]">
                  <Target size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collaborative study */}
      <section
        id="study-together"
        className="scroll-mt-10 border-y-[3px] border-black bg-[#DCE8D5]"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:px-12">
          <div className="order-2 border-[3px] border-black bg-white shadow-[8px_8px_0_#111] sm:shadow-[12px_12px_0_#111] lg:order-1">
            <div className="flex items-center justify-between border-b-[3px] border-black bg-[#F7F4EC] p-4">
              <div>
                <p className="text-sm font-black">THE STUDY SQUAD</p>
                <p className="mt-1 text-xs font-bold text-zinc-500">
                  A sample study room
                </p>
              </div>
              <div className="flex -space-x-2">
                {[
                  "bg-[#F8DCD0]",
                  "bg-[#DED8F5]",
                  "bg-[#FFF0A8]",
                  "bg-[#D9E9F7]",
                ].map((color, i) => (
                  <div
                    key={i}
                    className={`grid h-8 w-8 place-items-center rounded-full border-2 border-black ${color} text-xs font-black`}
                  >
                    {["A", "M", "J", "S"][i]}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center border-2 border-black bg-[#FFE500]">
                  <Users size={23} />
                </div>
                <div>
                  <p className="font-black">Physics exam prep</p>
                  <p className="text-xs font-bold text-zinc-500">
                    4 members · Sample group
                  </p>
                </div>
              </div>

              <div className="border-2 border-black p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-black">SHARED GOAL</span>
                  <span className="border border-black bg-[#FFF0A8] px-2 py-1 text-[10px] font-black">
                    THIS WEEK
                  </span>
                </div>
                <p className="font-black">Finish the Physics syllabus</p>
                <div className="mt-4 h-3 border-2 border-black bg-[#F7F4EC]">
                  <div className="h-full w-2/3 border-r-2 border-black bg-[#8CCF82]" />
                </div>
                <p className="mt-2 text-xs font-bold text-zinc-500">
                  Example progress: 2 of 3 milestones
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["A", "Review lecture notes", true],
                  ["M", "Solve practice questions", true],
                  ["J", "Finish revision sheet", false],
                ].map(([initial, title, done]) => (
                  <div
                    key={String(title)}
                    className="flex items-center gap-3 border border-zinc-200 p-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center border border-black bg-[#F7F4EC] text-xs font-black">
                      {initial}
                    </div>

                    <span className="flex-1 text-xs font-bold">{title}</span>

                    <div
                      className={`grid h-5 w-5 place-items-center border border-black ${
                        done ? "bg-[#DCE8D5]" : "bg-white"
                      }`}
                    >
                      {done && <Check size={12} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionLabel>Don't study alone</SectionLabel>
            <h2 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              ACCOUNTABILITY
              <br />
              IS A
              <br />
              <span className="underline decoration-[#FFE500] decoration-[8px] underline-offset-4">
                SUPERPOWER.
              </span>
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-zinc-700 sm:text-base">
              Create a study group, invite friends, set shared goals, and make
              time to work together. A little teamwork can make a big difference
              when deadlines get real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="border-2 border-black bg-white px-3 py-2 text-xs font-black">
                2–10 MEMBERS
              </div>
              <div className="border-2 border-black bg-white px-3 py-2 text-xs font-black">
                SHARED GOALS
              </div>
              <div className="border-2 border-black bg-white px-3 py-2 text-xs font-black">
                VIRTUAL STUDY ROOM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Focus / money strip */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col border-2 border-black bg-[#F8DCD0] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <Clock3 size={28} />
              <span className="text-xs font-black">FOCUS MODE</span>
            </div>
            <h3 className="mt-10 text-3xl font-black">
              One task. Your full attention.
            </h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-zinc-700">
              Set your work and break intervals, start a focus session, and
              create a routine that helps you work without constantly switching
              tasks.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-black">
              POMODORO + AMBIENT SOUND <ArrowRight size={16} />
            </div>
          </div>

          <div className="flex flex-col border-2 border-black bg-[#D9E9F7] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <CircleDollarSign size={28} />
              <span className="text-xs font-black">STUDENT FINANCE</span>
            </div>
            <h3 className="mt-10 text-3xl font-black">
              Your budget, minus the guesswork.
            </h3>
            <p className="mt-3 flex-1 text-sm leading-7 text-zinc-700">
              Keep track of daily spending, set category limits, split shared
              expenses, and see where your money goes each month.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-black">
              SPENDING + BUDGETS + INSIGHTS <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
        <div className="mx-auto max-w-7xl border-[3px] border-black bg-[#FFE500] p-7 shadow-[7px_7px_0_#111] sm:p-12 md:shadow-[12px_12px_0_#111] lg:p-16">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-black">
                <Sparkles size={15} /> YOUR NEXT CHAPTER STARTS HERE
              </div>
              <h2 className="max-w-3xl text-4xl font-black leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl">
                YOUR SEMESTER
                <br />
                WON&apos;T ORGANIZE ITSELF.
              </h2>
              <p className="mt-5 max-w-xl text-sm font-bold leading-7 sm:text-base">
                Notes, plans, habits, focus, and friends. Bring your student
                life into one space and take the next step.
              </p>
            </div>
            <div>
              <Link
                href="/auth/signup"
                className="inline-flex min-h-14 items-center gap-3 border-2 border-black bg-black px-6 py-4 text-sm font-black text-white transition-transform hover:-translate-y-1"
              >
                Create your account <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-[3px] border-black bg-[#F7F4EC]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center border-2 border-black bg-[#FFE500] font-black">
                F
              </span>
              <span className="text-lg font-black tracking-tight">FRIDAY.</span>
            </Link>

            <p className="max-w-sm text-xs leading-6 text-zinc-500">
              A student workspace for doing your work, building good habits, and
              making room for what matters.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold">
              <a href="#features" className="hover:underline">
                Features
              </a>
              <Link href="/auth/login" className="hover:underline">
                Log in
              </Link>
              <Link href="/auth/signup" className="hover:underline">
                Sign up
              </Link>
            </div>
          </div>
          <div className="mt-7 flex flex-col gap-2 border-t border-zinc-300 pt-5 text-[10px] font-bold text-zinc-500 sm:flex-row sm:justify-between">
            <span>
              © {new Date().getFullYear()} FRIDAY. ALL RIGHTS RESERVED.
            </span>
            <span>BUILT FOR THE NEXT GENERATION OF DOERS.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
