import { useRef, useSyncExternalStore } from "react"
import { Observable } from "rxjs"
import _ from 'lodash'

/**
 * React Hook that lets you subscribe to an observable.
 * @param data$
 */
const useObservable = <T>(data$: Observable<T>): T => {
    const snapshotRef = useRef<T>()

    const subscribe = (changed?: () => void) => {
        const subscription = data$.subscribe((data: T) => {
            // react uses Object.is() for equality to prevent re-renders but this doesn't work with rx operators
            // e.g. map() where the same object properties and values is returned by the objects do not have the
            // same reference
            if (!_.isEqual(snapshotRef.current, data)) {
                snapshotRef.current = data
                changed?.()
            }
        })

        return () => subscription.unsubscribe()
    }

    if (!snapshotRef.current) {
        (subscribe(undefined))()
    }

    const getSnapshot = () => snapshotRef.current as T

    return useSyncExternalStore<T>(subscribe, getSnapshot)
}

export default useObservable