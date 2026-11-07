import { useMemo, useState } from "react"
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react"

const tabs = [
  { label: "خلاصه", color: "#147d74" },
  { label: "عملکرد کل", color: "#ef4444" },
  { label: "اشتراک‌گیری", color: "#169b72" },
  { label: "نظرسنجی", color: "#ef4444" },
  { label: "شکایات مشتریان", color: "#1aa69a" },
  { label: "امنیت", color: "#e8911e" },
  { label: "اعتبار مشتریان", color: "#e8911e" },
  { label: "تولید اعتبار", color: "#e8911e" },
]

const summaryByTab = [
  [10, 7, 10],
  [8, 5, 12],
  [12, 4, 7],
  [6, 9, 8],
  [9, 6, 11],
  [13, 3, 5],
  [8, 8, 9],
  [11, 5, 7],
]

const reportSections = [
  {
    title: "عملکرد کل",
    score: "۷۵.۹٪",
    attention: true,
    items: [
      "رضایتمندی ۷۵.۹٪ است (آستانه خوب ≥ ۶۰٪)",
      "نرخ مشارکت نظرسنجی نسبت به سفارش‌ها پایین است",
      "تعداد سفارش: ۱۴۰,۸۰۹",
      "رضایت مشتریان: ۷۵.۹٪",
      "نرخ مشارکت نظرسنجی: ۱.۳٪",
    ],
  },
  {
    title: "تجربه و رضایت مشتری",
    score: "۸۲.۴٪",
    attention: false,
    items: [
      "امتیاز تجربه خرید نسبت به ماه قبل ۴.۲٪ رشد داشته است",
      "سرعت پاسخ‌گویی تیم پشتیبانی در محدوده مطلوب قرار دارد",
      "شاخص توصیه مشتریان: ۴۸",
    ],
  },
  {
    title: "شکایات مشتریان",
    score: "۶۴.۱٪",
    attention: true,
    items: [
      "زمان متوسط رسیدگی به شکایات ۱۸ ساعت است",
      "۲۳ پرونده بیش از ۴۸ ساعت در انتظار پاسخ هستند",
      "بیشترین موضوع شکایت مربوط به تاخیر در ارسال است",
    ],
  },
]

const navItems = [
  { label: "نمای کلی", icon: LayoutDashboard },
  { label: "گزارش‌ها", icon: BarChart3 },
  { label: "مشتریان", icon: Users },
  { label: "بازخوردها", icon: MessageSquareText },
  { label: "تنظیمات", icon: Settings },
]

interface ScoreRingProps {
  progress: number
  displayValue: string
  label: string
}

function ScoreRing({ progress, displayValue, label }: ScoreRingProps) {
  return (
    <div className="score-ring-wrap">
      <div
        className="score-ring"
        style={{
          background: `conic-gradient(#17877d ${progress * 3.6}deg, #e5eeed 0deg)`,
        }}
      >
        <div className="score-ring-center">
          <strong>{displayValue}</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const [activeNav, setActiveNav] = useState("نمای کلی")
  const [attentionOnly, setAttentionOnly] = useState(false)
  const [openSection, setOpenSection] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState("")

  const visibleReports = useMemo(
    () => reportSections.filter((item) => !attentionOnly || item.attention),
    [attentionOnly],
  )

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2400)
  }

  return (
    <div dir="rtl" className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <strong>دیدبان</strong>
            <span>صدای مشتری</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="side-nav" aria-label="منوی اصلی">
          <p>فضای کاری</p>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={activeNav === label ? "active" : ""}
              onClick={() => {
                setActiveNav(label)
                setMobileMenu(false)
                if (label !== "نمای کلی") showNotice(`بخش «${label}» انتخاب شد`)
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {label === "بازخوردها" && <b>۱۲</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-help">
          <CircleHelp size={21} />
          <strong>به راهنمایی نیاز دارید؟</strong>
          <span>مرکز راهنمای دیدبان در دسترس شماست.</span>
          <button onClick={() => showNotice("مرکز راهنما به‌زودی باز می‌شود")}>
            مشاهده راهنما
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">من</div>
          <div>
            <strong>مریم نادری</strong>
            <span>مدیر تجربه مشتری</span>
          </div>
          <ChevronDown size={17} />
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="بستن منو"
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="menu-button"
              onClick={() => setMobileMenu(true)}
              aria-label="باز کردن منو"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1>گزارش تجربه مشتری</h1>
              <p>نمایی سریع از وضعیت عملکرد و بازخورد مشتریان</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={18} />
              <input aria-label="جستجو" placeholder="جستجو در گزارش..." />
              <kbd>⌘ K</kbd>
            </div>
            <button
              className="icon-button"
              aria-label="اعلان‌ها"
              onClick={() => showNotice("اعلان جدیدی ندارید")}
            >
              <Bell size={20} />
              <span />
            </button>
            <button
              className="export-button"
              onClick={() => showNotice("خروجی گزارش آماده شد")}
            >
              <Download size={18} />
              دریافت گزارش
            </button>
          </div>
        </header>

        <div className="dashboard-body">
          <section className="period-bar">
            <div>
              <span>دوره گزارش</span>
              <strong>فروردین تا خرداد ۱۴۰۳</strong>
            </div>
            <div className="period-controls">
              <button
                aria-label="دوره بعدی"
                onClick={() => showNotice("این آخرین دوره ثبت‌شده است")}
              >
                <ChevronRight size={18} />
              </button>
              <button
                aria-label="دوره قبلی"
                onClick={() => showNotice("دوره قبلی بارگذاری شد")}
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </section>

          <div className="tabs-row" role="tablist" aria-label="بخش‌های گزارش">
            {tabs.map((tab, index) => (
              <button
                key={tab.label}
                className={activeTab === index ? "selected" : ""}
                onClick={() => setActiveTab(index)}
                role="tab"
                aria-selected={activeTab === index}
              >
                <i style={{ backgroundColor: tab.color }} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <label>
              <input
                type="checkbox"
                checked={attentionOnly}
                onChange={(event) => setAttentionOnly(event.target.checked)}
              />
              <span className="custom-checkbox" />
              فقط بخش‌های نیازمند توجه
            </label>
            <span>مرحله ۱ از ۱۲</span>
          </div>

          <section className="overview-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <Sparkles size={16} />
                  خلاصه هوشمند
                </span>
                <h2>خلاصه برای شروع صحبت با مشتری</h2>
                <p>
                  اول از این خلاصه شروع کنید؛ سپس بخش‌ها را یکی‌یکی مرور کنید.
                </p>
              </div>
              <div className="updated-at">آخرین به‌روزرسانی: امروز، ۱۰:۴۵</div>
            </div>

            <div className="summary-grid">
              <article className="summary-card danger">
                <div className="summary-icon">
                  <FileText size={19} />
                </div>
                <div>
                  <strong>
                    {summaryByTab[activeTab][2].toLocaleString("fa-IR")}
                  </strong>
                  <span>نیاز به اقدام</span>
                </div>
                <small>۳ مورد فوری</small>
              </article>
              <article className="summary-card warning">
                <div className="summary-icon">
                  <TrendingUp size={19} />
                </div>
                <div>
                  <strong>
                    {summaryByTab[activeTab][1].toLocaleString("fa-IR")}
                  </strong>
                  <span>قابل بهبود</span>
                </div>
                <small>۲ مورد جدید</small>
              </article>
              <article className="summary-card success">
                <div className="summary-icon">
                  <Sparkles size={19} />
                </div>
                <div>
                  <strong>
                    {summaryByTab[activeTab][0].toLocaleString("fa-IR")}
                  </strong>
                  <span>وضعیت خوب</span>
                </div>
                <small>رشد ۸٪</small>
              </article>
            </div>

            <div className="insight-grid">
              <div className="scores-panel">
                <div className="panel-title">
                  <div>
                    <h3>شاخص‌های کلیدی</h3>
                    <p>میانگین داده‌های ثبت‌شده در این دوره</p>
                  </div>
                  <span className="positive-badge">۴.۲٪ رشد</span>
                </div>
                <div className="rings">
                  <ScoreRing
                    progress={91.8}
                    displayValue="۹۱.۸٪"
                    label="اشتراک‌گیری"
                  />
                  <ScoreRing
                    progress={9.2}
                    displayValue="۹.۲٪"
                    label="مشارکت"
                  />
                  <ScoreRing
                    progress={100}
                    displayValue="۳٬۷۶۹"
                    label="مشتریان فعال"
                  />
                </div>
              </div>

              <div className="recommendation">
                <span className="recommendation-icon">
                  <Sparkles size={20} />
                </span>
                <div>
                  <span>پیشنهاد امروز</span>
                  <h3>نرخ مشارکت در نظرسنجی را افزایش دهید</h3>
                  <p>
                    ارسال پیام یادآوری ۲۴ ساعت بعد از سفارش می‌تواند نرخ پاسخ را
                    تا ۱۸٪ بهبود دهد.
                  </p>
                  <button
                    onClick={() => showNotice("پیشنهاد برای تیم شما ثبت شد")}
                  >
                    ثبت برای پیگیری
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-title">
              <div>
                <h2>بخش‌های گزارش</h2>
                <p>
                  جزئیات هر بخش را بررسی و موارد مهم را برای پیگیری انتخاب کنید.
                </p>
              </div>
              <span>
                {visibleReports.length.toLocaleString("fa-IR")} بخش از ۹
              </span>
            </div>

            <div className="report-list">
              {visibleReports.map((section) => {
                const originalIndex = reportSections.indexOf(section)
                const isOpen = openSection === originalIndex
                return (
                  <article
                    className={`report-item ${isOpen ? "open" : ""}`}
                    key={section.title}
                  >
                    <button
                      className="report-header"
                      onClick={() =>
                        setOpenSection(isOpen ? -1 : originalIndex)
                      }
                    >
                      <div className="report-name">
                        <span
                          className={
                            section.attention
                              ? "status-dot attention"
                              : "status-dot"
                          }
                        />
                        <div>
                          <strong>{section.title}</strong>
                          <small>
                            {section.attention
                              ? "نیازمند بررسی"
                              : "وضعیت مطلوب"}
                          </small>
                        </div>
                      </div>
                      <div className="report-score">
                        <span>{section.score}</span>
                        <ChevronDown size={19} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="report-content">
                        <ul>
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <button
                          onClick={() =>
                            showNotice(`جزئیات «${section.title}» باز شد`)
                          }
                        >
                          مشاهده گزارش کامل
                          <ChevronLeft size={16} />
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
              {visibleReports.length === 0 && (
                <div className="empty-state">بخش نیازمند توجهی پیدا نشد.</div>
              )}
            </div>
          </section>
        </div>
      </main>

      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}
