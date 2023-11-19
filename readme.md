# openai-term-chat

OpenAI chat application. 

You need an OpenAI API key which can be added to the .env environment file using API_KEY variable or entered when prompted.

```
API_KEY=XYZ
```

## Install

```bash
$ npm run build
$ npm install -g .
```

```bash
$ npm uninstall -g openai-term-chat
```

## Run without install

```bash
$ npm run start
```

## CLI

```
$ openai-term-chat --help

    Usage
	  $ openai-term-chat

	Options
		--apiKey  OpenAI API key
        --model Model name
        --instructions  Instructions for the chatbot
        --choices   Number of choices

	Examples
	  $ openai-term-chat --instructions 'You are a Javascript developer'
```
