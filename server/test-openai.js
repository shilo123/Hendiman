require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_ACCESS_KEY,
});

async function testCall() {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-nano",
      input: "ענה רק במילה אחת: עובד",
      max_output_tokens: 16,
    });
  } catch (error) {}
}

testCall();
