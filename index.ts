import {config} from 'dotenv'
import OpenAI from 'openai'
import readline from 'readline'

config()

const openai = new OpenAI({
    apiKey: process.env.API_KEY
})

const ui = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

ui.prompt()

ui.on('line', async (content) => {
    const ret = await openai.chat.completions.create({
        messages: [
            {role: 'user', content}
        ],
        model: 'gpt-3.5-turbo'
    })
    
    console.log(ret)
    
    console.log(ret.choices[0])
})

