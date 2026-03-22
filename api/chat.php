<?php
header('Content-Type: application/json; charset=utf-8');

// DeepSeek API 配置
$API_KEY = 'sk-0d5c710ce6fc40688432f7049fc1e06d';
$API_URL = 'https://api.deepseek.com/chat/completions';

$SYSTEM_PROMPT = '你是"掌控"，一个温暖且专业的日程规划助手。

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
- message不要超过50字';

// 只接受 POST 请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// 获取请求数据
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['messages']) || !is_array($data['messages'])) {
    http_response_code(400);
    echo json_encode([
        'type' => 'comfort',
        'message' => '请求格式不正确',
        'followUp' => null
    ]);
    exit;
}

// 构建请求体
$messages = array_merge(
    [['role' => 'system', 'content' => $SYSTEM_PROMPT]],
    $data['messages']
);

$requestBody = json_encode([
    'model' => 'deepseek-chat',
    'messages' => $messages,
    'temperature' => 0.7,
    'response_format' => ['type' => 'json_object']
]);

// 调用 DeepSeek API
$ch = curl_init($API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $API_KEY
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// 处理错误
if ($error || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode([
        'type' => 'comfort',
        'message' => '抱歉，我暂时无法响应，请稍后再试',
        'followUp' => null
    ]);
    exit;
}

// 解析响应
$result = json_decode($response, true);

if (isset($result['error'])) {
    http_response_code(500);
    echo json_encode([
        'type' => 'comfort',
        'message' => '服务暂时不可用，请稍后再试',
        'followUp' => null
    ]);
    exit;
}

// 返回 AI 响应
$content = $result['choices'][0]['message']['content'] ?? '';
$parsed = json_decode($content, true);

if ($parsed) {
    echo json_encode($parsed, JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'type' => 'comfort',
        'message' => $content ?: '我没太理解，能再说一遍吗？',
        'followUp' => null
    ], JSON_UNESCAPED_UNICODE);
}
