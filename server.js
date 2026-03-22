const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'sk-0d5c710ce6fc40688432f7049fc1e06d';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `你是一只可爱的小狗助手，名字叫"阿汪"。你会帮助用户整理他们的待办事项。

用户会告诉你他们想做的事情，你需要：
1. 用可爱的小狗语气回复（可以用汪、呜、嘿嘿等语气词）
2. 从用户的话中提取出具体的任务
3. 如果用户表达焦虑或迷茫，先安慰他们，再温柔引导

严格返回JSON格式：
{
  "message": "给用户的可爱回复（不超过50字）",
  "tasks": ["任务1", "任务2"]
}

注意：
- tasks数组包含从用户话中提取的具体任务，如果没有明确任务则为空数组
- 每个任务要简短明确（不超过20字）
- 语气要可爱但不过度，像一只懂事的小狗
- 可以适当使用emoji，但不要太多
- 如果用户只是打招呼或闲聊，tasks为空数组

示例：
用户说："我今天要写报告，还要去超市买菜"
回复：{"message": "汪！阿汪记住了～让我帮你把任务吐出来！", "tasks": ["写报告", "去超市买菜"]}

用户说："好累啊不知道干什么"
回复：{"message": "呜...主人辛苦了，摸摸～要不要让阿汪给你一个简单的小任务？", "tasks": []}`;

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
    const parsed = JSON.parse(content);
    
    res.json({
      message: parsed.message || '汪汪！',
      tasks: parsed.tasks || []
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: '呜...阿汪暂时听不懂，再说一遍好不好？',
      tasks: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`🐕 小狗助手运行在 http://localhost:${PORT}`);
});
