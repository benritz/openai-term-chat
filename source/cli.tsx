#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import {config} from 'dotenv'

const modelOptions = ['gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k']
const choicesOptions = [1,2,3]

const cli = meow(
	`
	Usage
	  $ openai-term-chat

	Options
		--apiKey  OpenAI API key
        --model Model name
        --instructions  Instructions for the chatbot
        --choices   Number of choices

	Examples
	  $ openai-term-chat --instructions 'You are a Javascript developer'
`,
	{
		importMeta: import.meta,
		flags: {
			apiKey: {
				type: 'string',
			},
            model: {
                type: 'string',
                choices: modelOptions
            },
			instructions: {
				type: 'string',
			},
			choices: {
				type: 'number',
                choices: choicesOptions
			}
		},
	},
);

config()

const {apiKey, instructions, choices, model} = cli.flags

const instance = render(<App 
    apiKey={apiKey || process.env['API_KEY']} 
    model={model}
    modelOptions={modelOptions}
    instructions={instructions}
    choices={choices}
    choicesOptions={choicesOptions}
/>)

instance.waitUntilExit()