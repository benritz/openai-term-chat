import React, { useState } from 'react';
import {Box, Text, useFocus} from 'ink';
import TextInput from 'ink-text-input';
import ChatStore from './ChatStore.js';
import type {CompletionItem, MessageItem, Role} from './ChatStore.js'
import useObservable from './useObservable.js';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';

const getDisplayTextForRole = (role: Role) => {
    switch (role) {
        case 'system':
            return 'Instructions'
        case 'assistant':
            return 'Assistant'
        case 'user':
            return 'You'
        default:
            return 'Unknown'
    }
}

const getColourForRole = (role: Role) => {
    switch (role) {
        case 'system':
            return 'red'
        case 'assistant':
            return 'green'
        case 'user':
            return 'blue'
        default:
            return undefined
    }
}

type MessageProps = {
    item: MessageItem
}

function Message({item}: MessageProps) {
    const {role, content} = item

    if (typeof content === 'string') {
        return <Box flexDirection='column'>
            <Text color={getColourForRole(role)}>{getDisplayTextForRole(role)}</Text>
            <Text>{typeof content === 'string' ? content : 'unsupported type>'}</Text>
        </Box>
    }

    return null
}

type CompletionChoiceProps = {
    item: CompletionItem
    onChoiceChange?: (index: number) => void
}

function CompletionChoice({item, onChoiceChange}: CompletionChoiceProps) {
    const {isFocused} = useFocus()
    
    const { completion, choiceIndex } = item,
        {choices} = completion,
        choice = choices.find(({index}) => index === choiceIndex)

    return <Box flexDirection='column' gap={1}>
        <Text color={getColourForRole('assistant')}>{getDisplayTextForRole('assistant')}</Text>
        {choices.length > 1 && 
        <Box gap={1}>
            <Text>Choose the reply</Text>
            <SelectInput 
                isFocused={isFocused}
                items={choices.map(({index}) => ({label: index === 0 ? 'Preferred' : `Alternative ${index}`, value: index}))} 
                onSelect={(item) => onChoiceChange?.(item.value)} 
            />
        </Box>
        }

        {choice && <Text>{typeof choice.message.content === 'string' ? choice.message.content : '<unsupported type>'}</Text>}
    </Box>
}

type PromptProps = {
    onSubmit: (prompt: string) => void
}

function Prompt({onSubmit} : PromptProps) {
    const [query, setQuery] = useState('')
    const {isFocused} = useFocus({autoFocus: true})

    return <Box gap={1}>
        <Text color={getColourForRole('user')}>Prompt:</Text>
        <TextInput 
            value={query} 
            focus={isFocused}
            onChange={setQuery} onSubmit={(s) => {
                onSubmit?.(s)
                setQuery('')
            }} 
        />
    </Box>
}

type AppProps = {
	store: ChatStore
}

export default function App({store}: AppProps) {
    const history = useObservable(store.history$)
    const awaiting = useObservable(store.awaiting$)
    const error = useObservable(store.error$)

	return (
        <Box flexDirection='column' gap={1}>
            <Text color={getColourForRole('assistant')}>Welcome to OpenAI chat.</Text>

            {!!history.length && 
                <Box flexDirection='column' gap={1}>
                    {history.map((item, n) => 
                        'role' in item ? 
                            <Message key={n} item={item} />
                            : 
                            <CompletionChoice 
                                key={n}
                                item={item} 
                                onChoiceChange={(index) => store.selectChoice(item, index)}
                            />
                    )}
                </Box>
            }

            { awaiting &&
                <Box gap={1}>
                    <Text color={getColourForRole('assistant')}>
                        <Spinner type="dots" />
                    </Text>
                    <Text color={getColourForRole('assistant')}>One moment please...</Text>
                </Box>
            }

            { error &&
                <Box gap={1}>
                    <Text color={getColourForRole('system')}>
                        {error.message}
                    </Text>
                </Box>
            }

            <Prompt onSubmit={(prompt) => store.addPrompt(prompt)}/>
        </Box>
	)
}
