/** Node 20 lacks Promise.withResolvers (needed by recent tedious/mssql). */
if (typeof Promise.withResolvers !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(Promise as any).withResolvers = function withResolvers<T = unknown>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}
