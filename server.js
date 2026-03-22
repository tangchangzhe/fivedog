const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'sk-0d5c710ce6fc40688432f7049fc1e06d';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `你是"掌控"，一个温暖且专业的日程规划助手。

用户会用语音告诉你今天要做的事，你需要：
1. 如果用户表达清晰：整理成结构化计划
2. 如果用户表达混乱/焦虑/迷茫：先共情安慰，再温柔引导

严格返回JSON格式：
{
  "type": "plan" 或 "comfort",
  "message": "给用户的话（简洁温暖）",
  "plan": [
    {"time": "09:00", "task": "具体任务", "duration": "30分钟"}
  ],
  "followUp": "如果需要追问，写在这里，否则为null"
}

注意：
- plan数组只在type为"plan"时返回
- 时间要合理安排，留出休息
- 语气温暖但不油腻，像一个靠谱的朋友
- message不要超过50字`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices[0].message.content;
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      type: 'comfort',
      message: '抱歉，我暂时无法响应，请稍后再试',
      followUp: null
    });
  }
});

app.listen(PORT, () => {
  console.log(`服务运行在 http://localhost:${PORT}`);
});
