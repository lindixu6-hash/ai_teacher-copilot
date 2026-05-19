# 阿里云一键重部署清单

> 适用场景：代码已更新，需要把 `/teacher-copilot-app/` 线上入口重新部署到阿里云 ECS。

## 目标

- 产品页：`http://47.86.191.93/teacher-copilot-app/`
- 演示页：`http://47.86.191.93/teacher-copilot/`

## 先决条件

- 服务器目录：`/root/ai-teacher-copilot`
- 进程管理：`pm2`
- 反向代理：`nginx`
- 生产子路径：`NEXT_PUBLIC_BASE_PATH=/teacher-copilot-app`

## 一次性命令

在 ECS 上依次执行：

```bash
cd /root/ai-teacher-copilot
git pull origin main

# 如果服务器上没有正确的子路径配置，先确认环境变量
grep NEXT_PUBLIC_BASE_PATH .env.local || echo 'NEXT_PUBLIC_BASE_PATH=/teacher-copilot-app'

npm install
npm run build

pm2 restart ai-teacher-copilot || pm2 start npm --name ai-teacher-copilot -- start
pm2 save

nginx -t && systemctl reload nginx
```

## 验证

```bash
curl -I http://127.0.0.1:3000/teacher-copilot-app/
curl -I http://47.86.191.93/teacher-copilot-app/
curl -sS http://47.86.191.93/teacher-copilot-app/ | head -n 20
```

## 如果还是旧页面

1. 检查 Nginx 是否仍把 `/teacher-copilot/` 指向旧静态页。
2. 检查 `pm2 list` 里是不是有旧的 demo 进程。
3. 确认 `NEXT_PUBLIC_BASE_PATH` 在构建前就已经生效。
4. 重新执行：

```bash
pm2 stop ai-teacher-copilot
pm2 delete ai-teacher-copilot
cd /root/ai-teacher-copilot
npm run build
pm2 start npm --name ai-teacher-copilot -- start
pm2 save
```

## 备注

- `trailingSlash: true` 已在项目配置里开启，避免子路径斜杠跳转打架。
- 线上产品页和演示页是两个不同入口，不要混用。
