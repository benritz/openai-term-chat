import React, { useState } from 'react';
import {Box, Text} from 'ink';
import ChatStore, { ChatStoreProps } from './chatstore.js';
import Chat from './chat.js';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

type AppProps = {
    apiKey?: string
    instructions?: string
    choices?: number
    choicesOptions: number[]
    model?: string
    modelOptions: string[]
}

let chatStore: ChatStore

const getChatStore = (props: ChatStoreProps) => {
    chatStore = chatStore || new ChatStore(props)
    return chatStore
}

enum ConfigStep {
    ApiKeyEntry,
    InstructionsEntry,
    ChoicesEntry,
    ModelEntry,
    Ready
}

export default function App(props: AppProps) {
    const [apiKey, setApiKey] = useState(props.apiKey || '')
    const [model, setModel] = useState(props.model)
    const [instructions, setInstructions] = useState(props.instructions || '')
    const [choices, setChoices] = useState(props.choices)
    const [configStep, setConfigStep] = useState(ConfigStep.ApiKeyEntry)

	return (
        <Box flexDirection='column' gap={1}>
            {configStep === ConfigStep.ApiKeyEntry && 
                <Box gap={1}>
                    <Text>API key:</Text>
                    <TextInput 
                        value={apiKey} 
                        onChange={(s) => setApiKey(s)} 
                        onSubmit={() => setConfigStep(ConfigStep.ModelEntry)}
                        />
                </Box> }
            {configStep === ConfigStep.ModelEntry &&     
                <Box gap={1}>
                    <Text>Model:</Text>
                    <SelectInput<string> 
                        initialIndex={props.modelOptions.findIndex((item) => item === model)}
                        items={props.modelOptions.map((item) => ({value: item, label: item}))} 
                        onSelect={(item) => {
                            setModel(item.value)
                            setConfigStep(ConfigStep.InstructionsEntry)
                        }}
                        />
                </Box>}
            {configStep === ConfigStep.InstructionsEntry &&     
                <Box gap={1}>
                    <Text>Instructions:</Text>
                    <TextInput 
                        value={instructions} 
                        onChange={(s) => setInstructions(s)} 
                        onSubmit={() => setConfigStep(ConfigStep.ChoicesEntry)}
                        />
                </Box>}
            {configStep === ConfigStep.ChoicesEntry && 
                <Box gap={1}>
                    <Text>Choices:</Text>
                    <SelectInput<number> 
                        initialIndex={props.choicesOptions.findIndex((item) => item === choices)}
                        items={props.choicesOptions.map((item) => ({value: item, label: item.toString()}))} 
                        onSelect={(item) => {
                            setChoices(item.value)
                            setConfigStep(ConfigStep.Ready)
                        }}
                        />
                </Box> }
            {configStep === ConfigStep.Ready && 
                <Chat store={getChatStore({apiKey, instructions, choices, model})} /> }
        </Box>
	)
}
