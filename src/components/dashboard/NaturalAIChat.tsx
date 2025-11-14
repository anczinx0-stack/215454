// Enhanced Hugging Face API Call with Detailed Logging
const callHFApi = async (prompt: string, maxRetries = 3): Promise<string> => {
  const apiKey = import.meta.env.VITE_HF_API_KEY;
  if (!apiKey) {
    console.error('❌ HF API Key Missing: Check .env for VITE_HF_API_KEY');
    return 'Hugging Face API key is not configured. Please add VITE_HF_API_KEY to your .env file.';
  }

  const MODEL = 'google/gemma-2-9b-it'; // Free, powerful

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 HF API Attempt ${attempt + 1}: Sending "${prompt.substring(0, 50)}..."`); // Log start

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${MODEL}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 512,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false,
            }
          })
        }
      );

      console.log(`📡 HF Response Status: ${response.status}`); // Log status

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || `HTTP ${response.status} - Failed to fetch`;

        // Specific handling
        if (response.status === 401) {
          console.error('❌ 401 Unauthorized: Invalid API key. Regenerate at huggingface.co/settings/tokens');
          return 'Invalid API key. Please check your VITE_HF_API_KEY in .env and restart the server.';
        }
        if (response.status === 403) {
          console.error('❌ 403 Forbidden: Token lacks permissions. Use a "Write" token.');
          return 'API token lacks permissions. Create a new "Write" token.';
        }
        if (response.status === 429) {
          console.error('❌ 429 Rate Limit: Too many requests. Wait 1-5 mins.');
          return 'Rate limit hit. Please wait and try again.';
        }
        if (response.status === 503) {
          console.error('❌ 503 Service Unavailable: Model loading or outage. Retrying...');
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Jitter
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return 'Model is loading or service busy. Try again in 1-2 minutes.';
        }

        console.error(`❌ HF Error ${response.status}: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('✅ HF Success:', data); // Log full response

      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text.trim();
      }
      if (data.generated_text) {
        return data.generated_text.trim();
      }

      return 'I apologize, but I could not generate a response. Please try again.';
    } catch (error: any) {
      console.error(`💥 HF Fetch Error (Attempt ${attempt + 1}):`, error.message);
      if (attempt === maxRetries) {
        return `Network error: ${error.message}. Check console for details (F12). Common fixes: Restart server, check key, or try incognito.`;
      }
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return 'Max retries exceeded. Check your connection and try again.';
};