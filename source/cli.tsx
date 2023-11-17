#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import {config} from 'dotenv'
import ChatStore from './ChatStore.js';

// @ts-ignore
const cli = meow(
	`
	Usage
	  $ openai-term-chat

	Options
		--apiKey  OpenAI API key
        --instructions  Instructions for the chatbot

	Examples
	  $ openai-term-chat --instructions 'You are a Javascript developer'
`,
	{
		importMeta: import.meta,
		flags: {
			apiKey: {
				type: 'string',
			},
			instructions: {
				type: 'string',
			},
		},
	},
);

config()

const {apiKey, instructions} = cli.flags

const store = new ChatStore({ 
    apiKey: apiKey || process.env['API_KEY'] || 'MISSING_KEY',
    instructions
})

render(<App store={store} />);

