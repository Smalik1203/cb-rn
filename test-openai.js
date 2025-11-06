// Quick test script to verify OpenAI API key
// Run with: node test-openai.js

const API_KEY = process.env.OPENAI_API_KEY || ''; // Get from environment variable

async function testOpenAI() {
  console.log('Testing OpenAI API key...');
  console.log('API Key (first 10 chars):', API_KEY.substring(0, 10));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, the API key works!"',
          },
        ],
        max_tokens: 20,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error?.message || 'Unknown error');
      console.error('Full response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Success! API key is working!');
    console.log('Response:', data.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testOpenAI();
