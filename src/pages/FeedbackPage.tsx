import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DidbanIcon } from '../components/didbanIcons'
import { isStaff, useAuth } from '../lib/authContext'
import {
  feedbackKey,
  fetchFeedback,
  fetchFeedbackItem,
  kindLabelFa,
  patchFeedbackStatus,
  postFeedbackComment,
  statusLabelFa,
  type FeedbackItem,
  type FeedbackKind,
  type FeedbackStatus,
} from '../lib/feedbackApi'
import { faWhen } from '../lib/feedbackUi'
import styles from './FeedbackInbox.module.css'

type FilterTab = 'all' | 'bug' | 'idea'

function isIdea(kind: FeedbackKind) {
  return kind === 'improvement' || kind === 'change'
}

export function FeedbackPage() {
  const { id: routeId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const staff = isStaff(user?.role)

  const [items, setItems] = useState<FeedbackItem[]>([])
  const [active, setActive] = useState<FeedbackItem | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)

  const reloadList = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await fetchFeedback({})
      setItems(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadList()
  }, [reloadList])

  const filtered = useMemo(() => {
    if (filter === 'bug') return items.filter((i) => i.kind === 'bug')
    if (filter === 'idea') return items.filter((i) => isIdea(i.kind))
    return items
  }, [items, filter])

  const selectId = routeId || filtered[0]?.id || items[0]?.id

  useEffect(() => {
    if (!selectId) {
      setActive(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    void fetchFeedbackItem(selectId)
      .then((it) => {
        if (!cancelled) setActive(it)
      })
      .catch((e) => {
        if (!cancelled) {
          setActive(null)
          setError(e instanceof Error ? e.message : 'خطا در جزئیات')
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectId])

  const onSelect = (id: string) => {
    navigate(`/feedback/${id}`, { replace: !routeId })
  }

  const onComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!active || !comment.trim() || commentBusy) return
    setCommentBusy(true)
    try {
      const next = await postFeedbackComment(active.id, comment.trim())
      setActive(next)
      setComment('')
      setItems((prev) =>
        prev.map((it) => (it.id === next.id ? { ...it, ...next } : it)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال کامنت ناموفق')
    } finally {
      setCommentBusy(false)
    }
  }

  const onStatus = async (status: FeedbackStatus) => {
    if (!active || !staff || statusBusy || active.status === status) return
    setStatusBusy(true)
    try {
      const next = await patchFeedbackStatus(active.id, status)
      setActive(next)
      setItems((prev) =>
        prev.map((it) => (it.id === next.id ? { ...it, ...next } : it)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق')
    } finally {
      setStatusBusy(false)
    }
  }

  const statusOptions: FeedbackStatus[] = [
    'open',
    'in_progress',
    'done',
    'wontfix',
  ]

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>پیشنهادات</div>
          <h1 className={styles.title}>صندوق پیشنهاد و باگ</h1>
          <p className={styles.sub}>
            پیگیری موارد گزارش‌شده از تیم و مشتریان
          </p>
        </div>
        <Link className={styles.primaryBtn} to="/feedback/new">
          <DidbanIcon name="plus" size={17} />
          ثبت پیشنهاد
        </Link>
      </div>

      <div className={styles.panelWrap}>
        {error ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.layout}>
          <div className={styles.panel}>
            <div className={styles.filters}>
              {(
                [
                  ['all', 'همه'],
                  ['bug', 'باگ'],
                  ['idea', 'پیشنهاد'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.filterBtn}${filter === id ? ` ${styles.filterOn}` : ''}`}
                  onClick={() => setFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.list}>
              {loading ? (
                <div className={styles.empty}>در حال بارگذاری…</div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>موردی با این فیلتر نیست.</div>
              ) : (
                filtered.map((it) => {
                  const selected = it.id === selectId
                  return (
                    <button
                      key={it.id}
                      type="button"
                      className={`${styles.row}${selected ? ` ${styles.rowSelected}` : ''}`}
                      onClick={() => onSelect(it.id)}
                    >
                      <span
                        className={`${styles.typeDot} ${
                          it.kind === 'bug' ? styles.typeBug : styles.typeIdea
                        }`}
                      />
                      <div className={styles.rowMain}>
                        <div className={styles.rowTitle}>{it.title}</div>
                        <div className={styles.rowMeta}>
                          {feedbackKey(it.id)}
                          {it.brand?.brandName
                            ? ` · ${it.brand.brandName}`
                            : ''}
                          {` · ${faWhen(it.updatedAt)}`}
                        </div>
                      </div>
                      <span className={styles.chip}>
                        {statusLabelFa(it.status)}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className={styles.detail}>
            {!selectId || (!active && !detailLoading) ? (
              <div className={styles.empty}>
                یک مورد را از فهرست انتخاب کنید.
              </div>
            ) : detailLoading && !active ? (
              <div className={styles.empty}>بارگذاری جزئیات…</div>
            ) : active ? (
              <>
                <div className={styles.detailHead}>
                  <div>
                    <div className={styles.detailEyebrow}>
                      {kindLabelFa(active.kind)} · {feedbackKey(active.id)}
                    </div>
                    <h2 className={styles.detailTitle}>{active.title}</h2>
                    <div className={styles.detailSub}>
                      {active.brand?.brandName
                        ? `${active.brand.brandName} · `
                        : ''}
                      {active.displayName} · {faWhen(active.updatedAt)}
                    </div>
                  </div>
                  <span className={styles.chip}>
                    {statusLabelFa(active.status)}
                  </span>
                </div>

                <p className={styles.body}>{active.body}</p>

                {staff ? (
                  <div className={styles.statusRow}>
                    {statusOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={statusBusy}
                        className={`${styles.statusBtn}${
                          active.status === s ? ` ${styles.statusBtnOn}` : ''
                        }`}
                        onClick={() => void onStatus(s)}
                      >
                        {statusLabelFa(s)}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className={styles.thread}>
                  <div className={styles.msg}>
                    <div className={styles.msgMeta}>
                      گزارش‌دهنده · {active.displayName} ·{' '}
                      {faWhen(active.createdAt)}
                    </div>
                    <div>{active.body}</div>
                  </div>
                  {(active.comments || []).map((c) => (
                    <div
                      key={c.id}
                      className={`${styles.msg}${
                        c.visibility === 'admin' ? ` ${styles.msgAdmin}` : ''
                      }`}
                    >
                      <div className={styles.msgMeta}>
                        {c.displayName}
                        {c.visibility === 'admin' ? ' · ادمین' : ''} ·{' '}
                        {faWhen(c.at)}
                      </div>
                      <div>{c.body}</div>
                    </div>
                  ))}
                </div>

                <form className={styles.compose} onSubmit={(e) => void onComment(e)}>
                  <input
                    className={styles.composeInput}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="پاسخ یا توضیح تکمیلی…"
                  />
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={commentBusy || !comment.trim()}
                  >
                    ارسال
                  </button>
                </form>

                <Link className={styles.fullLink} to={`/feedback/${active.id}/edit`}>
                  ویرایش کامل / تصاویر ←
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
