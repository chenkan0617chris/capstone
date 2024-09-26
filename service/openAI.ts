import OpenAI from "openai";
import { ChatCompletionMessage } from "openai/resources";
import { CHOICES } from "../constants/constants";

const query = async (text: string, choices: string[]):Promise<ChatCompletionMessage> => {

    let prompt = `Detected text:
        ${text}
        These are the text that I detected from a image, please give the information as the template I list in the following. 
        If you can fill the broken words up, please provide the complete characters. If there is no information about the criteria, then respond 'No Found!'.
        when Ingredient and Nutrition are in the template, please respond a table.
        Template:
    `;

    if(choices.includes(CHOICES[0])){
        prompt += '\n Ingredient:';
    }
    if(choices.includes(CHOICES[1])){
        prompt += '\n Nutrition:';
    }
    if(choices.includes(CHOICES[2])){
        prompt += '\n Brand:';
    }
    if(choices.includes(CHOICES[3])){
        prompt += '\n Logo:';
    }

    console.log(prompt);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, dangerouslyAllowBrowser: true });

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful character analyzer." },
            {
                role: "user",
                content: prompt
            },
        ],
    });
    return completion.choices[0].message;
}

export default query;