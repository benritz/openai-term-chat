import React, { useState } from 'react';
import {Box, Text} from 'ink';
import TextInput from 'ink-text-input';
import ChatStore, { HistoryItem } from './ChatStore.js';
import type {Message, Role} from './ChatStore.js'
import useObservable from './useObservable.js';
import Spinner from 'ink-spinner';

const getDisplayTextForRole = (role: Role) => {
    switch (role) {
        case 'system':
            return 'System'
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
    message: Message
}

function Message({message}: MessageProps) {
    const {role, content} = message

    if (typeof content === 'string') {
        return <Box flexDirection='column'>
            <Text color={getColourForRole(role)}>{getDisplayTextForRole(role)}</Text>
            <Text>{typeof content === 'string' ? content : 'unsupported type>'}</Text>
        </Box>
    }

    return null
}

type ItemProps = {
    item: HistoryItem
}

function Item({item}: ItemProps) {
    if ('role' in item) {
        return <Message message={item} />
    }

    const { completion, choiceIndex } = item

    const choice = completion.choices.find(({index}) => index === choiceIndex)
    if (choice) {
        return <Message message={choice.message} />
    }

    return null
}

type AppProps = {
	store: ChatStore
}

export default function App({store}: AppProps) {
    const [query, setQuery] = useState('')
    const history = useObservable(store.history$)
    const awaiting = useObservable(store.awaiting$)
    const error = useObservable(store.error$)

	return (
        <Box flexDirection='column' gap={1}>
            <Text color={getColourForRole('assistant')}>Welcome to OpenAI chat.</Text>

            {!!history.length && 
                <Box flexDirection='column' gap={1}>
                    {history.map((item, n) => <Item item={item} key={n} />)}
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

            <Box gap={1}>
                <Text color={getColourForRole('user')}>Prompt:</Text>
                <TextInput value={query} onChange={setQuery} onSubmit={(s) => {
                    store.addPrompt(s)
                    setQuery('')
                }} />
            </Box>
        </Box>
	)
}
