import { useMemo, useState, type ReactNode } from "react";

type Page = "setup" | "review" | "reports" | "feedback";
type ReviewStage = "summary" | "sections" | "followup" | "send";
type IconName =
  | "home"
  | "report"
  | "message"
  | "help"
  | "user"
  | "settings"
  | "users"
  | "search"
  | "chevron"
  | "arrow"
  | "calendar"
  | "store"
  | "check"
  | "spark"
  | "clock"
  | "close"
  | "menu"
  | "trend"
  | "phone"
  | "send"
  | "download"
  | "filter"
  | "eye"
  | "plus"
  | "refresh"
  | "attachment"
  | "more";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    report: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M14 3v4h4M9 11h6M9 15h6" />
      </>
    ),
    message: (
      <>
        <path d="M4 5h16v11H8l-4 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.3 2.3 0 1 1 3.5 2c-.8.5-1.3 1-1.3 2M12 17h.01" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 13.5v-3l-2-.7-.6-1.4.9-2-2.1-2.1-2 .9-1.4-.6-.8-2H8l-.7 2-1.4.6-2-.9-2.1 2.1.9 2-.6 1.4-2 .7v3l2 .7.6 1.4-.9 2 2.1 2.1 2-.9 1.4.6.7 2h3l.8-2 1.4-.6 2 .9 2.1-2.1-.9-2 .6-1.4z" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c.5-3 2.5-5 6-5s5.5 2 6 5M16 5a3 3 0 0 1 0 6M17 14c2.3.3 3.7 1.8 4 4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    chevron: <path d="m9 6 6 6-6 6" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    store: (
      <>
        <path d="M4 10v10h16V10M3 10l2-6h14l2 6" />
        <path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2M9 20v-5h6v5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    spark: (
      <>
        <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    trend: <path d="m4 17 5-5 4 3 7-8M15 7h5v5" />,
    phone: (
      <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-2-2 2c-3.6-1.5-6.5-4.4-8-8l2-2z" />
    ),
    send: <path d="m21 3-7 18-4-7-7-4zM10 14 21 3" />,
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4" />
        <path d="M4 19h16" />
      </>
    ),
    filter: <path d="M4 5h16M7 12h10M10 19h4" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M18.5 9a7 7 0 1 0 .2 6" />
      </>
    ),
    attachment: <path d="m8 12 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l8-8" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "soft" }) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

const collections = [
  { id: 1, name: "اسمارت سنتر آزادی", detail: "تهران · شعبه آزادی", code: "آز", tone: "lime" },
  {
    id: 2,
    name: "اسمارت سنتر سعادت‌آباد",
    detail: "تهران · شعبه سعادت‌آباد",
    code: "سع",
    tone: "sand",
  },
  { id: 3, name: "اسمارت سنتر ونک", detail: "تهران · شعبه ونک", code: "ون", tone: "mint" },
  { id: 4, name: "مجموعه آریا", detail: "البرز · شعبه مرکزی", code: "آر", tone: "rose" },
];

const templates = [
  {
    id: 1,
    title: "بررسی سریع",
    description: "نمای کلی وضعیت مجموعه و شاخص‌های ضروری",
    meta: "۵ بخش · حدود ۳ دقیقه",
    icon: "spark" as IconName,
    recommended: true,
  },
  {
    id: 2,
    title: "پس از تحویل",
    description: "کیفیت تحویل، آموزش و تجربه شروع مشتری",
    meta: "۸ بخش · حدود ۶ دقیقه",
    icon: "check" as IconName,
  },
  {
    id: 3,
    title: "تماس بعد از تمدید",
    description: "رضایت از تمدید، پشتیبانی و عملکرد سرویس",
    meta: "۶ بخش · حدود ۴ دقیقه",
    icon: "clock" as IconName,
  },
];

const reportRows = [
  {
    id: 1,
    collection: "اسمارت سنتر آزادی",
    type: "بررسی سریع",
    date: "امروز، ۱۰:۴۵",
    score: 82,
    status: "آماده ارسال",
    tone: "warn",
    owner: "رضا حکیمی",
  },
  {
    id: 2,
    collection: "اسمارت سنتر ونک",
    type: "پس از تحویل",
    date: "امروز، ۰۹:۱۰",
    score: 91,
    status: "ارسال شده",
    tone: "ok",
    owner: "سارا محمدی",
  },
  {
    id: 3,
    collection: "اسمارت سنتر سعادت‌آباد",
    type: "تماس بعد تمدید",
    date: "دیروز، ۱۶:۲۰",
    score: 68,
    status: "نیازمند پیگیری",
    tone: "bad",
    owner: "علی رضایی",
  },
  {
    id: 4,
    collection: "مجموعه آریا",
    type: "بررسی سریع",
    date: "۲ روز پیش",
    score: 76,
    status: "پیش‌نویس",
    tone: "neutral",
    owner: "رضا حکیمی",
  },
];

const feedbackRows = [
  {
    id: 1,
    title: "نمایش کامل تقویم بازه دلخواه",
    category: "بهبود",
    sender: "مریم کریمی",
    date: "۱۰ دقیقه پیش",
    status: "جدید",
    tone: "info",
    text: "در نمایشگر لپ‌تاپ، بخش پایین تقویم کامل دیده نمی‌شود. بهتر است تقویم با فضای صفحه هماهنگ شود.",
  },
  {
    id: 2,
    title: "خطا در خروجی PDF گزارش",
    category: "باگ",
    sender: "علی رضایی",
    date: "امروز، ۰۹:۳۲",
    status: "در حال بررسی",
    tone: "warn",
    text: "در گزارش بعضی مجموعه‌ها، نمودار رضایت داخل PDF نمایش داده نمی‌شود.",
  },
  {
    id: 3,
    title: "افزودن فیلتر مسئول بررسی",
    category: "پیشنهاد",
    sender: "سارا محمدی",
    date: "دیروز",
    status: "انجام شد",
    tone: "ok",
    text: "برای گزارش‌های تیمی امکان فیلتر براساس نام اپراتور خیلی کاربردی است.",
  },
];

function Sidebar({
  open,
  active,
  onClose,
  onNavigate,
}: {
  open: boolean;
  active: Page;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}) {
  const navItems: { page?: Page; label: string; icon: IconName; badge?: string }[] = [
    { page: "setup", label: "بررسی جدید", icon: "home" },
    { page: "reports", label: "گزارش‌ها", icon: "report", badge: "۱۲" },
    { page: "feedback", label: "پیشنهادات", icon: "message", badge: "۲" },
    { label: "راهنما", icon: "help" },
    { label: "حساب من", icon: "user" },
  ];
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>دیدبان</strong>
            <small>صدای مشتری اسمارت</small>
          </div>
        </div>
        <AppButton
          variant="ghost"
          className="sidebar__close"
          onClick={onClose}
          aria-label="بستن منو"
        >
          <Icon name="close" />
        </AppButton>
        <nav className="nav" aria-label="منوی اصلی">
          <span className="nav__caption">منوی اصلی</span>
          {navItems.map((item) => (
            <AppButton
              key={item.label}
              variant="ghost"
              className={`nav__item ${item.page === active || (active === "review" && item.page === "setup") ? "is-active" : ""}`}
              onClick={() => {
                if (item.page) onNavigate(item.page);
                onClose();
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.badge && <em>{item.badge}</em>}
            </AppButton>
          ))}
          <span className="nav__caption nav__caption--admin">مدیریت</span>
          <AppButton variant="ghost" className="nav__item">
            <Icon name="settings" />
            <span>تنظیمات بررسی</span>
          </AppButton>
          <AppButton variant="ghost" className="nav__item">
            <Icon name="users" />
            <span>کاربران</span>
          </AppButton>
        </nav>
        <div className="profile">
          <div className="avatar">ر ح</div>
          <div>
            <strong>رضا حکیمی</strong>
            <small>مدیر سیستم</small>
          </div>
          <AppButton variant="ghost">
            <Icon name="chevron" size={17} />
          </AppButton>
        </div>
      </aside>
    </>
  );
}

function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  return (
    <header className="topbar">
      <AppButton variant="ghost" className="menu-button" onClick={onMenu}>
        <Icon name="menu" />
      </AppButton>
      <div className="breadcrumb">
        <span>دیدبان</span>
        <Icon name="chevron" size={16} />
        <strong>{title}</strong>
      </div>
      <div className="topbar__actions">
        <span className="system-status">
          <i /> سامانه فعال
        </span>
        <AppButton variant="ghost" className="help-button">
          <Icon name="help" size={19} />
          <span>راهنمای این صفحه</span>
        </AppButton>
      </div>
    </header>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}

function SetupFlow({ onStart }: { onStart: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<number | null>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(1);
  const [step, setStep] = useState(1);
  const filtered = useMemo(
    () => collections.filter((item) => item.name.includes(query) || item.detail.includes(query)),
    [query],
  );
  const collection = collections.find((item) => item.id === selectedCollection);
  const template = templates.find((item) => item.id === selectedTemplate);
  const steps = ["انتخاب مجموعه", "انتخاب قالب", "تنظیم بازه"];
  return (
    <div className="page">
      <PageHeading
        eyebrow="بررسی جدید"
        title="بیایید یک بررسی بسازیم"
        description="مجموعه و قالب موردنظر را انتخاب کنید؛ ادامه مسیر کمتر از یک دقیقه زمان می‌برد."
        action={
          <div className="quick-stat">
            <Icon name="clock" />
            <div>
              <strong>آخرین بررسی</strong>
              <span>امروز، ۱۰:۴۵ · مجموعه ونک</span>
            </div>
            <AppButton variant="ghost">
              مشاهده <Icon name="chevron" size={15} />
            </AppButton>
          </div>
        }
      />
      <div className="stepper">
        {steps.map((label, index) => (
          <div
            key={label}
            className={`step ${step === index + 1 ? "is-active" : ""} ${step > index + 1 ? "is-done" : ""}`}
          >
            <div className="step__number">
              {step > index + 1 ? (
                <Icon name="check" size={15} />
              ) : (
                (index + 1).toLocaleString("fa-IR")
              )}
            </div>
            <span>{label}</span>
            {index < 2 && <i />}
          </div>
        ))}
      </div>
      {step === 1 && (
        <section className="panel">
          <div className="panel__heading">
            <div className="heading-icon">
              <Icon name="store" />
            </div>
            <div>
              <h2>کدام مجموعه را بررسی می‌کنید؟</h2>
              <p>نام مجموعه یا شعبه را جست‌وجو کنید.</p>
            </div>
          </div>
          <label className="search-field">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جست‌وجوی نام مجموعه یا شعبه..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="section-label">
            <span>مجموعه‌های اخیر</span>
            <span>{filtered.length.toLocaleString("fa-IR")} مجموعه</span>
          </div>
          <div className="collection-grid">
            {filtered.map((item) => (
              <AppButton
                variant="ghost"
                key={item.id}
                className={`collection-card ${selectedCollection === item.id ? "is-selected" : ""}`}
                onClick={() => setSelectedCollection(item.id)}
              >
                <span className={`collection-logo collection-logo--${item.tone}`}>{item.code}</span>
                <span className="collection-copy">
                  <strong>{item.name}</strong>
                  <small>{item.detail}</small>
                </span>
                <span className="radio">
                  <Icon name="check" size={14} />
                </span>
              </AppButton>
            ))}
          </div>
          {!filtered.length && <div className="empty-state">مجموعه‌ای با این نام پیدا نشد.</div>}
        </section>
      )}
      {step === 2 && (
        <section className="panel">
          <div className="panel__heading">
            <div className="heading-icon">
              <Icon name="spark" />
            </div>
            <div>
              <h2>چه نوع بررسی‌ای نیاز دارید؟</h2>
              <p>قالب مناسب را براساس هدف بررسی انتخاب کنید.</p>
            </div>
          </div>
          <div className="template-grid">
            {templates.map((item) => (
              <AppButton
                variant="ghost"
                key={item.id}
                className={`template-card ${selectedTemplate === item.id ? "is-selected" : ""}`}
                onClick={() => setSelectedTemplate(item.id)}
              >
                {item.recommended && <span className="recommended">پیشنهاد دیدبان</span>}
                <span className="template-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="template-copy">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <em>{item.meta}</em>
                </span>
                <span className="radio">
                  <Icon name="check" size={14} />
                </span>
              </AppButton>
            ))}
          </div>
        </section>
      )}
      {step === 3 && (
        <section className="panel">
          <div className="panel__heading">
            <div className="heading-icon">
              <Icon name="calendar" />
            </div>
            <div>
              <h2>بازه گزارش را مشخص کنید</h2>
              <p>یک بازه سریع انتخاب کنید یا تاریخ دلخواه وارد کنید.</p>
            </div>
          </div>
          <div className="period-grid">
            {["امروز", "۷ روز گذشته", "۳۰ روز گذشته", "بازه دلخواه"].map((period, index) => (
              <AppButton
                variant="ghost"
                className={`period-card ${index === 1 ? "is-selected" : ""}`}
                key={period}
              >
                <span>{period}</span>
                {index === 1 && <Icon name="check" size={16} />}
              </AppButton>
            ))}
          </div>
          <div className="review-summary">
            <span>
              <Icon name="store" />
              <small>مجموعه</small>
              <strong>{collection?.name}</strong>
            </span>
            <i />
            <span>
              <Icon name="spark" />
              <small>قالب بررسی</small>
              <strong>{template?.title}</strong>
            </span>
            <i />
            <span>
              <Icon name="calendar" />
              <small>بازه گزارش</small>
              <strong>۷ روز گذشته</strong>
            </span>
          </div>
        </section>
      )}
      <footer className="action-bar">
        <div className="selection-summary">
          {step > 1 ? (
            <>
              <span className="mini-logo">{collection?.code}</span>
              <div>
                <small>مجموعه انتخاب‌شده</small>
                <strong>{collection?.name}</strong>
              </div>
            </>
          ) : (
            <span className="selection-hint">
              <Icon name="spark" size={17} /> با انتخاب مجموعه، قالب‌های مناسب نمایش داده می‌شوند.
            </span>
          )}
        </div>
        <div className="action-bar__buttons">
          {step > 1 && (
            <AppButton variant="soft" onClick={() => setStep(step - 1)}>
              مرحله قبل
            </AppButton>
          )}
          <AppButton
            className="continue-button"
            onClick={() => (step < 3 ? setStep(step + 1) : onStart())}
            disabled={!selectedCollection || !selectedTemplate}
          >
            {step === 1 ? "انتخاب قالب بررسی" : step === 2 ? "تنظیم بازه گزارش" : "شروع بررسی"}
            <Icon name="arrow" />
          </AppButton>
        </div>
      </footer>
    </div>
  );
}

const metrics = [
  { label: "رضایت مشتریان", value: "۸۶٪", change: "۴٪ رشد", tone: "ok" },
  { label: "وضعیت اشتراک", value: "۹۲٪", change: "عالی", tone: "ok" },
  { label: "کیفیت اتصال", value: "۷۴٪", change: "قابل بهبود", tone: "warn" },
  { label: "شارژ و اعتبار", value: "۶۸٪", change: "نیازمند توجه", tone: "bad" },
];

function ReviewPage({
  stage,
  setStage,
  onReports,
  notify,
}: {
  stage: ReviewStage;
  setStage: (stage: ReviewStage) => void;
  onReports: () => void;
  notify: (message: string) => void;
}) {
  const stages: { id: ReviewStage; label: string }[] = [
    { id: "summary", label: "خلاصه گزارش" },
    { id: "sections", label: "بررسی بخش‌ها" },
    { id: "followup", label: "نکات پیگیری" },
    { id: "send", label: "ارسال گزارش" },
  ];
  const next: Record<ReviewStage, ReviewStage | null> = {
    summary: "sections",
    sections: "followup",
    followup: "send",
    send: null,
  };
  const [checks, setChecks] = useState([true, true, false, false]);
  return (
    <div className="page review-page">
      <PageHeading
        eyebrow="گزارش زنده"
        title="اسمارت سنتر آزادی"
        description="بررسی سریع · ۷ روز گذشته · آخرین بروزرسانی همین حالا"
        action={
          <div className="review-heading-actions">
            <AppButton variant="soft" onClick={() => notify("اطلاعات گزارش بروزرسانی شد")}>
              <Icon name="refresh" size={17} /> بروزرسانی
            </AppButton>
            <AppButton variant="soft" onClick={() => notify("نسخه PDF آماده دانلود است")}>
              <Icon name="download" size={17} /> خروجی PDF
            </AppButton>
          </div>
        }
      />
      <div className="review-stagebar">
        {stages.map((item, index) => (
          <AppButton
            variant="ghost"
            key={item.id}
            className={`review-stage ${stage === item.id ? "is-active" : ""}`}
            onClick={() => setStage(item.id)}
          >
            <span>{index + 1}</span>
            {item.label}
          </AppButton>
        ))}
      </div>
      {stage === "summary" && (
        <div className="review-content">
          <section className="score-hero">
            <div className="score-ring">
              <div>
                <strong>۸۲</strong>
                <small>از ۱۰۰</small>
              </div>
            </div>
            <div className="score-copy">
              <span className="status-chip status-chip--ok">وضعیت خوب</span>
              <h2>عملکرد مجموعه پایدار است</h2>
              <p>
                امتیاز کلی نسبت به بازه قبل ۶ واحد افزایش داشته است. اتصال و شارژ دو موضوع اصلی برای
                پیگیری هستند.
              </p>
              <div>
                <span>
                  <Icon name="trend" size={16} /> ۶ امتیاز رشد
                </span>
                <span>
                  <Icon name="users" size={16} /> ۱۴۸ مشتری
                </span>
              </div>
            </div>
          </section>
          <section className="metric-grid">
            {metrics.map((metric) => (
              <div className="metric-card" key={metric.label}>
                <div className={`metric-indicator metric-indicator--${metric.tone}`}>
                  <Icon name={metric.tone === "ok" ? "check" : "trend"} size={17} />
                </div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small className={`tone-${metric.tone}`}>{metric.change}</small>
              </div>
            ))}
          </section>
          <section className="insight-card">
            <div className="insight-icon">
              <Icon name="spark" />
            </div>
            <div>
              <strong>جمع‌بندی دیدبان</strong>
              <p>
                رضایت عمومی بالاست، اما ۱۱ مشتری قطعی اتصال و ۷ مشتری مشکل شارژ گزارش کرده‌اند.
                پیشنهاد می‌شود این دو گروه امروز پیگیری شوند.
              </p>
            </div>
            <AppButton variant="soft" onClick={() => setStage("followup")}>
              دیدن پیگیری‌ها <Icon name="chevron" size={16} />
            </AppButton>
          </section>
        </div>
      )}
      {stage === "sections" && (
        <div className="section-review-layout">
          <aside className="section-list">
            <span className="section-list__caption">بخش‌های گزارش</span>
            {["رضایت کلی", "اشتراک و تمدید", "کیفیت اتصال", "شارژ و اعتبار", "پشتیبانی"].map(
              (item, index) => (
                <AppButton
                  variant="ghost"
                  key={item}
                  className={`section-list__item ${index === 0 ? "is-active" : ""}`}
                >
                  <span>
                    {index < 2 ? (
                      <Icon name="check" size={14} />
                    ) : (
                      (index + 1).toLocaleString("fa-IR")
                    )}
                  </span>
                  <div>
                    <strong>{item}</strong>
                    <small>{index < 2 ? "بررسی شده" : "در انتظار بررسی"}</small>
                  </div>
                  <Icon name="chevron" size={15} />
                </AppButton>
              ),
            )}
          </aside>
          <section className="section-detail">
            <div className="section-detail__head">
              <div>
                <span className="eyebrow">بخش اول از پنج</span>
                <h2>رضایت کلی مشتریان</h2>
                <p>خلاصه پاسخ‌ها و شاخص‌های مرتبط با تجربه کلی مشتری</p>
              </div>
              <span className="large-status">
                ۸۶٪ <small>رضایت</small>
              </span>
            </div>
            <div className="question-list">
              {[
                "کیفیت کلی خدمات مناسب بوده است",
                "پاسخ‌گویی تیم پشتیبانی رضایت‌بخش بوده است",
                "استفاده از سرویس را به دیگران پیشنهاد می‌کنم",
                "فرآیند دریافت خدمات ساده و سریع بوده است",
              ].map((text, index) => (
                <AppButton
                  variant="ghost"
                  className={`question-row ${checks[index] ? "is-checked" : ""}`}
                  key={text}
                  onClick={() =>
                    setChecks(checks.map((value, i) => (i === index ? !value : value)))
                  }
                >
                  <span className="check-box">
                    {checks[index] && <Icon name="check" size={15} />}
                  </span>
                  <span>{text}</span>
                  <em>{["۹۲٪", "۸۷٪", "۸۱٪", "۷۸٪"][index]}</em>
                </AppButton>
              ))}
            </div>
            <label className="note-field">
              <span>یادداشت اپراتور</span>
              <textarea placeholder="نکته‌ای برای این بخش بنویسید..." />
            </label>
          </section>
        </div>
      )}
      {stage === "followup" && (
        <div className="followup-layout">
          <section className="followup-main">
            <div className="content-head">
              <div>
                <h2>نکات نیازمند پیگیری</h2>
                <p>موارد مهم از تمام بخش‌های گزارش در یک فهرست جمع شده‌اند.</p>
              </div>
              <AppButton>
                <Icon name="plus" size={17} /> افزودن پیگیری
              </AppButton>
            </div>
            {[
              {
                title: "قطعی مکرر اتصال برای ۱۱ مشتری",
                meta: "کیفیت اتصال · اولویت بالا",
                tone: "bad",
              },
              {
                title: "مشکل شارژ حساب ۷ مشتری",
                meta: "شارژ و اعتبار · اولویت متوسط",
                tone: "warn",
              },
              { title: "درخواست آموزش مجدد پنل", meta: "پشتیبانی · ۴ مشتری", tone: "info" },
            ].map((item, index) => (
              <div className="followup-row" key={item.title}>
                <button className={`task-check ${index === 2 ? "is-done" : ""}`}>
                  <Icon name="check" size={14} />
                </button>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </div>
                <span className={`status-dot status-dot--${item.tone}`} />
                <AppButton variant="ghost">
                  <Icon name="more" />
                </AppButton>
              </div>
            ))}
          </section>
          <aside className="followup-side">
            <span className="eyebrow">پیشرفت پیگیری</span>
            <strong>۱ از ۳ مورد</strong>
            <div className="progress">
              <i />
            </div>
            <p>
              دو مورد باز باقی مانده است. می‌توانید گزارش را ارسال و پیگیری‌ها را بعداً تکمیل کنید.
            </p>
            <div className="owner-row">
              <div className="avatar">ر ح</div>
              <div>
                <small>مسئول پیگیری</small>
                <strong>رضا حکیمی</strong>
              </div>
              <AppButton variant="ghost">تغییر</AppButton>
            </div>
          </aside>
        </div>
      )}
      {stage === "send" && (
        <div className="send-layout">
          <section className="send-form">
            <div className="content-head">
              <div>
                <h2>ارسال گزارش</h2>
                <p>روش ارسال و گیرنده گزارش را مشخص کنید.</p>
              </div>
              <span className="status-chip status-chip--ok">
                <Icon name="check" size={14} /> آماده ارسال
              </span>
            </div>
            <span className="field-title">روش ارسال</span>
            <div className="channel-grid">
              <AppButton variant="ghost" className="channel-card is-selected">
                <span>
                  <Icon name="message" />
                </span>
                <div>
                  <strong>پیام به مشتری</strong>
                  <small>ارسال لینک خلاصه گزارش</small>
                </div>
                <i>
                  <Icon name="check" size={13} />
                </i>
              </AppButton>
              <AppButton variant="ghost" className="channel-card">
                <span>
                  <Icon name="report" />
                </span>
                <div>
                  <strong>فایل PDF</strong>
                  <small>گزارش کامل و قابل چاپ</small>
                </div>
                <i>
                  <Icon name="check" size={13} />
                </i>
              </AppButton>
            </div>
            <label className="form-field">
              <span>شماره همراه گیرنده</span>
              <input defaultValue="۰۹۱۲ ۱۲۳ ۴۵۶۷" />
            </label>
            <label className="form-field">
              <span>متن پیام</span>
              <textarea defaultValue="سلام، گزارش بررسی کیفیت خدمات مجموعه اسمارت سنتر آزادی آماده شده است. برای مشاهده گزارش از لینک زیر استفاده کنید." />
            </label>
            <div className="send-notice">
              <Icon name="check" size={17} />
              <span>لینک گزارش به صورت خودکار به انتهای پیام اضافه می‌شود.</span>
            </div>
          </section>
          <aside className="pdf-preview">
            <div className="pdf-preview__top">
              <span>
                <Icon name="report" size={17} /> پیش‌نمایش گزارش
              </span>
              <AppButton variant="ghost">
                <Icon name="eye" size={17} /> مشاهده کامل
              </AppButton>
            </div>
            <div className="paper">
              <div className="paper-brand">
                <div className="brand__mark">
                  <span />
                  <span />
                  <span />
                </div>
                <strong>گزارش دیدبان</strong>
              </div>
              <span>اسمارت سنتر آزادی</span>
              <div className="paper-score">
                ۸۲ <small>امتیاز کل</small>
              </div>
              <div className="paper-lines">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </aside>
        </div>
      )}
      <footer className="review-footer">
        <span>
          <Icon name="check" size={16} /> تغییرات به‌صورت خودکار ذخیره می‌شوند.
        </span>
        <div>
          {stage !== "summary" && (
            <AppButton
              variant="soft"
              onClick={() =>
                setStage(stages[Math.max(0, stages.findIndex((item) => item.id === stage) - 1)].id)
              }
            >
              مرحله قبل
            </AppButton>
          )}
          <AppButton
            onClick={() =>
              next[stage]
                ? setStage(next[stage]!)
                : (notify("گزارش برای مشتری ارسال شد"), onReports())
            }
          >
            {stage === "send" ? (
              <>
                <Icon name="send" size={17} /> ارسال گزارش
              </>
            ) : (
              <>
                ادامه بررسی <Icon name="arrow" size={17} />
              </>
            )}
          </AppButton>
        </div>
      </footer>
    </div>
  );
}

function ReportsPage({
  notify,
  onNew,
  onOpen,
}: {
  notify: (message: string) => void;
  onNew: () => void;
  onOpen: () => void;
}) {
  const [selected, setSelected] = useState(1);
  const [query, setQuery] = useState("");
  const rows = reportRows.filter(
    (row) => row.collection.includes(query) || row.type.includes(query),
  );
  const current = reportRows.find((row) => row.id === selected) ?? reportRows[0];
  return (
    <div className="page wide-page">
      <PageHeading
        eyebrow="صندوق گزارش‌ها"
        title="گزارش‌های بررسی"
        description="همه گزارش‌های تیم را ببینید، پیگیری کنید و برای مشتری بفرستید."
        action={
          <AppButton onClick={onNew}>
            <Icon name="plus" size={17} /> بررسی جدید
          </AppButton>
        }
      />
      <div className="inbox-toolbar">
        <label className="compact-search">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجوی مجموعه یا نوع بررسی..."
          />
        </label>
        <div className="filter-tabs">
          <AppButton variant="ghost" className="is-active">
            همه <em>۱۲</em>
          </AppButton>
          <AppButton variant="ghost">
            نیازمند پیگیری <em>۳</em>
          </AppButton>
          <AppButton variant="ghost">ارسال شده</AppButton>
        </div>
        <AppButton variant="soft">
          <Icon name="filter" size={17} /> فیلترها
        </AppButton>
      </div>
      <div className="inbox-layout">
        <section className="report-table">
          <div className="table-head">
            <span>مجموعه</span>
            <span>نوع بررسی</span>
            <span>امتیاز</span>
            <span>وضعیت</span>
            <span>تاریخ</span>
          </div>
          {rows.map((row) => (
            <AppButton
              variant="ghost"
              key={row.id}
              className={`table-row ${selected === row.id ? "is-selected" : ""}`}
              onClick={() => setSelected(row.id)}
            >
              <span className="table-collection">
                <i>{row.collection.slice(-2)}</i>
                <strong>{row.collection}</strong>
                <small>{row.owner}</small>
              </span>
              <span>{row.type}</span>
              <span
                className={`score-cell tone-${row.score > 80 ? "ok" : row.score > 70 ? "warn" : "bad"}`}
              >
                {row.score.toLocaleString("fa-IR")}
              </span>
              <span>
                <em className={`status-chip status-chip--${row.tone}`}>{row.status}</em>
              </span>
              <span>
                {row.date}
                <Icon name="chevron" size={15} />
              </span>
            </AppButton>
          ))}
          {!rows.length && <div className="empty-state">گزارشی پیدا نشد.</div>}
        </section>
        <aside className="report-drawer">
          <div className="drawer-head">
            <span className={`status-chip status-chip--${current.tone}`}>{current.status}</span>
            <AppButton variant="ghost">
              <Icon name="more" />
            </AppButton>
          </div>
          <div className="drawer-title">
            <span className="mini-logo">{current.collection.slice(-2)}</span>
            <div>
              <h2>{current.collection}</h2>
              <p>
                {current.type} · {current.date}
              </p>
            </div>
          </div>
          <div className="drawer-score">
            <div className="small-score">{current.score.toLocaleString("fa-IR")}</div>
            <div>
              <strong>امتیاز کلی گزارش</strong>
              <small>۶ امتیاز بهتر از بازه قبل</small>
            </div>
          </div>
          <div className="drawer-facts">
            <span>
              <small>مسئول بررسی</small>
              <strong>{current.owner}</strong>
            </span>
            <span>
              <small>بازه گزارش</small>
              <strong>۷ روز گذشته</strong>
            </span>
            <span>
              <small>موارد پیگیری</small>
              <strong>۲ مورد باز</strong>
            </span>
          </div>
          <div className="drawer-actions">
            <AppButton onClick={onOpen}>
              <Icon name="eye" size={17} /> مشاهده گزارش
            </AppButton>
            <AppButton variant="soft" onClick={() => notify("فایل PDF دانلود شد")}>
              <Icon name="download" size={17} /> دانلود PDF
            </AppButton>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FeedbackPage({ notify }: { notify: (message: string) => void }) {
  const [selected, setSelected] = useState(1);
  const [reply, setReply] = useState("");
  const [newModal, setNewModal] = useState(false);
  const current = feedbackRows.find((row) => row.id === selected) ?? feedbackRows[0];
  return (
    <div className="page wide-page">
      <PageHeading
        eyebrow="بازخورد تیم"
        title="پیشنهادات و مشکلات"
        description="درخواست‌های تیم را ببینید، پاسخ دهید و وضعیت پیشرفت را مدیریت کنید."
        action={
          <AppButton onClick={() => setNewModal(true)}>
            <Icon name="plus" size={17} /> ثبت پیشنهاد
          </AppButton>
        }
      />
      <div className="feedback-stats">
        <div>
          <span className="stat-icon stat-icon--info">
            <Icon name="message" />
          </span>
          <strong>۱۲</strong>
          <small>همه موارد</small>
        </div>
        <div>
          <span className="stat-icon stat-icon--warn">
            <Icon name="clock" />
          </span>
          <strong>۴</strong>
          <small>در حال بررسی</small>
        </div>
        <div>
          <span className="stat-icon stat-icon--ok">
            <Icon name="check" />
          </span>
          <strong>۷</strong>
          <small>انجام شده</small>
        </div>
      </div>
      <div className="feedback-layout">
        <section className="feedback-inbox">
          <div className="feedback-toolbar">
            <label className="compact-search">
              <Icon name="search" size={17} />
              <input placeholder="جست‌وجو در پیشنهادات..." />
            </label>
            <AppButton variant="soft">
              <Icon name="filter" size={17} />
            </AppButton>
          </div>
          {feedbackRows.map((item) => (
            <AppButton
              variant="ghost"
              key={item.id}
              className={`feedback-item ${selected === item.id ? "is-selected" : ""}`}
              onClick={() => setSelected(item.id)}
            >
              <div className="feedback-item__top">
                <span className={`status-chip status-chip--${item.tone}`}>{item.status}</span>
                <small>{item.date}</small>
              </div>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
              <div>
                <span className="avatar avatar--tiny">{item.sender.slice(0, 1)}</span>
                <span>{item.sender}</span>
                <em>{item.category}</em>
              </div>
            </AppButton>
          ))}
        </section>
        <section className="feedback-detail">
          <div className="feedback-detail__head">
            <div>
              <span className={`status-chip status-chip--${current.tone}`}>{current.status}</span>
              <h2>{current.title}</h2>
              <p>
                ثبت شده توسط {current.sender} · {current.date}
              </p>
            </div>
            <AppButton variant="soft">
              تغییر وضعیت <Icon name="chevron" size={15} />
            </AppButton>
          </div>
          <div className="conversation">
            <div className="message-bubble">
              <div className="avatar avatar--tiny">{current.sender.slice(0, 1)}</div>
              <div>
                <strong>{current.sender}</strong>
                <p>{current.text}</p>
                <span>امروز، ۱۰:۲۴</span>
              </div>
            </div>
            <div className="message-bubble message-bubble--admin">
              <div className="avatar avatar--tiny">ر</div>
              <div>
                <strong>شما</strong>
                <p>ممنون از گزارش دقیق شما. موضوع بررسی شد و در نسخه بعدی اصلاح می‌شود.</p>
                <span>امروز، ۱۰:۴۱</span>
              </div>
            </div>
          </div>
          <div className="reply-box">
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="پاسخ خود را بنویسید..."
            />
            <div>
              <AppButton variant="ghost">
                <Icon name="attachment" size={18} /> پیوست فایل
              </AppButton>
              <AppButton
                disabled={!reply}
                onClick={() => {
                  notify("پاسخ شما ثبت شد");
                  setReply("");
                }}
              >
                <Icon name="send" size={16} /> ارسال پاسخ
              </AppButton>
            </div>
          </div>
        </section>
      </div>
      {newModal && (
        <div className="modal-backdrop" onClick={() => setNewModal(false)}>
          <section className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>ثبت پیشنهاد جدید</h2>
                <p>مشکل یا ایده خود را برای تیم محصول بنویسید.</p>
              </div>
              <AppButton variant="ghost" onClick={() => setNewModal(false)}>
                <Icon name="close" />
              </AppButton>
            </div>
            <label className="form-field">
              <span>عنوان</span>
              <input placeholder="عنوان کوتاه و واضح" />
            </label>
            <label className="form-field">
              <span>نوع درخواست</span>
              <select defaultValue="بهبود">
                <option>بهبود</option>
                <option>باگ</option>
                <option>پیشنهاد</option>
              </select>
            </label>
            <label className="form-field">
              <span>توضیحات</span>
              <textarea placeholder="جزئیات، مراحل تکرار یا نتیجه مورد انتظار..." />
            </label>
            <div className="modal-actions">
              <AppButton variant="soft" onClick={() => setNewModal(false)}>
                انصراف
              </AppButton>
              <AppButton
                onClick={() => {
                  setNewModal(false);
                  notify("پیشنهاد جدید ثبت شد");
                }}
              >
                ثبت پیشنهاد
              </AppButton>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("setup");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stage, setStage] = useState<ReviewStage>("summary");
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const titles: Record<Page, string> = {
    setup: "بررسی جدید",
    review: "گزارش بررسی",
    reports: "گزارش‌ها",
    feedback: "پیشنهادات",
  };
  const navigate = (target: Page) => {
    setPage(target);
    document.querySelector(".workspace")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="app" dir="rtl">
      <Sidebar
        open={menuOpen}
        active={page}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
      />
      <main className="workspace">
        <Topbar title={titles[page]} onMenu={() => setMenuOpen(true)} />
        {page === "setup" && (
          <SetupFlow
            onStart={() => {
              setStage("summary");
              navigate("review");
              notify("گزارش آماده بررسی است");
            }}
          />
        )}
        {page === "review" && (
          <ReviewPage
            stage={stage}
            setStage={setStage}
            onReports={() => navigate("reports")}
            notify={notify}
          />
        )}
        {page === "reports" && (
          <ReportsPage
            notify={notify}
            onNew={() => navigate("setup")}
            onOpen={() => {
              setStage("summary");
              navigate("review");
            }}
          />
        )}
        {page === "feedback" && <FeedbackPage notify={notify} />}
      </main>
      {toast && (
        <div className="toast">
          <span>
            <Icon name="check" size={17} />
          </span>
          <div>
            <strong>{toast}</strong>
            <small>عملیات با موفقیت انجام شد.</small>
          </div>
        </div>
      )}
    </div>
  );
}
