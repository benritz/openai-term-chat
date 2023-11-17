import { EMPTY, Observable, Subject, distinctUntilChanged, from, map, scan, shareReplay, startWith, switchMap, filter } from 'rxjs'
import OpenAI from 'openai'
import _ from 'lodash'

type Role = 'system' | 'assistant' | 'user' | 'function' | 'tool'

type MessageItem = OpenAI.Chat.Completions.ChatCompletionMessageParam

type CompletionItem = {
    completion: OpenAI.Chat.Completions.ChatCompletion
    choiceIndex: number
}

type HistoryItem = MessageItem | CompletionItem

type State = {
    version: number
    history: HistoryItem[]
    lastPrompt?: MessageItem
    awaiting: boolean
    error?: Error
}

// Actions
type AddPromptAction = {
    type: 'addPrompt'
    content: string
}

type AddCompletionAction = {
    type: 'addCompletion'
    completion: OpenAI.Chat.Completions.ChatCompletion
}

type ErrorAction = {
    type: 'error'
    err: unknown
}

type SelectChoiceAction = {
    type: 'selectChoice'
    completion: CompletionItem
    index: number
}

type Action = AddPromptAction | AddCompletionAction | ErrorAction | SelectChoiceAction

type ChatStoreProps = {
    apiKey: string
    instructions?: string
}

class ChatStore {
    private _actions$ = new Subject<Action>()
    private _history$: Observable<HistoryItem[]>
    private _awaiting$: Observable<boolean>
    private _error$: Observable<Error|undefined>

    private dispatch(action: Action) {
        this._actions$.next(action);
    }

    constructor(props: ChatStoreProps) {
        const {
            apiKey,
            instructions
        } = props

        const initialState: State = {
            version: 0,
            history: instructions ? [{role: 'system', content: instructions}] : [],
            awaiting: false
        }

        const reducer = (state: State, action: Action|undefined): State => {
            let changes: Partial<State>|undefined;

            switch (action?.type) {
                case 'addPrompt': {
                    const { content } = action,
                        lastPrompt: MessageItem = {role:'user', content}
                    changes = {
                        history: [...state.history, lastPrompt], 
                        lastPrompt,
                        awaiting: true,
                        error: undefined
                    }
                }
                    break

                case 'addCompletion': {
                    const { completion } = action
                    changes = {
                        history: [...state.history, { completion, choiceIndex: 0 }],
                        awaiting: false
                    }
               }
                    break

                case 'error': {
                    const { err } = action

                    const toError = (err: unknown) => 
                        err instanceof Error ? err : new Error(err + '')

                    changes = { 
                        error: toError(err), 
                        awaiting: false 
                    }
                }
                    break

                case 'selectChoice': {
                    const {completion, index} = action

                    changes = {
                        history: state.history.map((item) => 
                            item === completion ? { ...completion, choiceIndex: index } : item)
                    }
                }
                    break;
            }

            return changes ? {...state, ...changes, version: state.version + 1} : state;
        }

        const state$: Observable<State> = this._actions$.pipe(
            startWith(undefined),
            scan<Action|undefined, State>(reducer, initialState),
            shareReplay(1),
        
            // ensure only latest version is emitted
            scan<State, State>((prev, curr) => curr.version > prev.version ? curr : prev),
            distinctUntilChanged()
        )

        // Effects
        const addCompletion$ = state$.pipe(
            filter(({lastPrompt}) => !!lastPrompt),
            distinctUntilChanged((a,b) => a.lastPrompt === b.lastPrompt),
            map(({history}): OpenAI.Chat.Completions.ChatCompletionMessageParam[] => 
                history.map((item) => {
                    if ('completion' in item) {
                        const choice = item.completion.choices.find((choice) => choice.index === item.choiceIndex)
                        return choice?.message
                    }

                    return item
                })
                .filter((item): item is OpenAI.Chat.Completions.ChatCompletionMessageParam => !!item)
            ),            
            switchMap((messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Observable<AddCompletionAction|ErrorAction> => {
                if (!messages.length) {
                    return EMPTY
                }

                const submit = async (): Promise<AddCompletionAction|ErrorAction> => {
                    try {
                        const openai = new OpenAI({apiKey})
    
                        const completion = await openai.chat.completions.create({
                            messages,
                            model: 'gpt-3.5-turbo',
                            n: 3
                        })
    
                        return { type: 'addCompletion', completion }    
                    } catch (err) {
                        return { type: 'error', err }
                    }
                }

                return from(submit())
            })
        )

        addCompletion$.subscribe(this._actions$)

        // Selectors
        this._history$ = state$.pipe(
            distinctUntilChanged((a,b) => a.history === b.history),
            map(({history}) => history)
        )

        this._awaiting$ = state$.pipe(
            distinctUntilChanged((a,b) => a.awaiting === b.awaiting),
            map(({awaiting}) => awaiting)
        )

        this._error$ = state$.pipe(
            distinctUntilChanged((a,b) => a.error === b.error),
            map(({error}) => error)
        )
    }

    destroy() {
        this._actions$.complete()
    }

    // Selectors
    get history$() {
        return this._history$
    }

    get awaiting$() {
        return this._awaiting$
    }

    get error$() {
        return this._error$
    }

    // Disatchers
    addPrompt(content: string) {
        content = content.trim()
        if (content.length > 0) {
            this.dispatch({type: 'addPrompt', content})
        }
    }

    selectChoice(completion: CompletionItem, index: number) {
        this.dispatch({type: 'selectChoice', completion, index})
    }
}

export default ChatStore

export type {Role, HistoryItem, MessageItem, CompletionItem}