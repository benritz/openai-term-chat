import {config} from 'dotenv'
import OpenAI from 'openai'
import readline from 'readline'

config()

const openai = new OpenAI({
    apiKey: process.env.API_KEY
})

const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {role: 'system', content: 'You are not very helpful'}
]

const model = 'gpt-3.5-turbo'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You: '
})

process.stdout.write(`Welcome to OpenAI terminal chat. Enter a prompt to begin chatting. Ctrl-D to quit.\n`)

rl.prompt()

rl.on('line', async (line) => {
    messages.push({role: 'user', content: line})

    const ret = await openai.chat.completions.create({
        messages,
        model
    })
    
    console.log(ret)


    const outputChoice = (choice: OpenAI.Chat.Completions.ChatCompletion.Choice) => {
        const {message} = choice

        messages.push(message)
        const {content} = message
        if (content) {
            process.stdout.write(`Assistent: ${content}\n`)
        }    
    }

    const {choices} = ret

    if (choices.length === 0) {
        // what?
    } else if (choices.length === 1) {
        outputChoice(choices[0])
    } else {
        outputChoice(choices[0])
        // display multiple choices and options to switch between them
    }

    rl.prompt()
})

