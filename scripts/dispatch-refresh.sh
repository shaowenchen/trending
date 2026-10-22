#!/usr/bin/env bash
# ── 本机兜底触发器：GitHub 的 cron 排程不可靠（丢触发/新排程注册延迟，实测
#    2026-10-21 新排程 2 小时未生效），这台机器常开，由它按 15 分钟一档调
#    workflow_dispatch 触发同一条 CI 流水线。
#
# 行为：
#   · 先看**线上**数据的年龄（cn-hot.json 的 fetchedAt）：< 12 分钟 → 跳过
#     （CI 自己也不会刷，不值得白跑一次流水线）；
#   · ≥ 12 分钟 → workflow_dispatch；CI 里分组判龄再决定 fast/slow 刷什么，
#     数据无变化的提交步骤会自动跳过，不会产生空提交。
#
# 凭据从 git credential store 现取现用（推送用的同一个 PAT），不写入任何文件。
# 挂载：crontab 里 `*/15 * * * * …/scripts/dispatch-refresh.sh >> /tmp/trend-dispatch.log 2>&1`
set -uo pipefail
cd "$(dirname "$0")/.."

NODE="$HOME/.nvm/versions/node/v22.23.2/bin/node"
[ -x "$NODE" ] || NODE=$(command -v node || true)
[ -z "$NODE" ] && { echo "no node"; exit 0; }

AGE=$(curl -sS -m 15 "https://www.chenshaowen.com/trend/assets/data/cn-hot.json" 2>/dev/null \
  | "$NODE" -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      try { const j=JSON.parse(s); console.log(Math.round((Date.now()-Date.parse(j.fetchedAt))/60000)); }
      catch { console.log(9999); }
    });" 2>/dev/null || echo 9999)

if [ "${AGE:-9999}" -lt 12 ] 2>/dev/null; then
  echo "$(date -u +%FT%TZ) 数据新鲜（${AGE} 分钟前），跳过"
  exit 0
fi

TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git credential fill 2>/dev/null | grep '^password=' | cut -d= -f2)
[ -z "$TOKEN" ] && { echo "$(date -u +%FT%TZ) 无凭据，跳过"; exit 0; }

code=$(curl -sS -m 20 -X POST -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/shaowenchen/trending/actions/workflows/pages.yml/dispatches" \
  -d '{"ref":"dev"}' -o /dev/null -w "%{http_code}")
echo "$(date -u +%FT%TZ) 数据 ${AGE} 分钟前 → dispatch HTTP $code"
