#!/usr/bin/env python3
"""계약 FAQ md → contract-faq-data.js (contract-faq.html이 읽는 데이터).

사용: python3 tools/build_contract_faq.py ~/Desktop/계약_자주묻는질문_20261101.md
- md의 '## 0.'(확정된 공식 안내)와 '## 1.' ~ '## 7.'만 싣는다. '# 후순위' 아래(8~12)는 싣지 않는다.
- 질문은 '### N-M. 제목', 답은 '- **① 공식** …' / '- **② 문의 답변** …' / '- **③ 회원 의견** …' 세 칸.
- 질문 번호(N-M)가 댓글의 키라서, 번호를 바꾸면 기존 댓글이 다른 질문에 붙는다. 번호는 고정해서 쓴다.
외부 패키지 없이 md의 일부 문법(목록·표·굵게·인용)만 HTML로 바꾼다. 원문은 운영진이 쓴 내용이라 신뢰한다.
"""
import html
import json
import re
import sys
from datetime import datetime

MAX_SECTION = 7
TIER_RE = re.compile(r'^- \*\*([①②③])[^*]*\*\*\s*(.*)$')
TIER_KEY = {'①': 'official', '②': 'inquiry', '③': 'member'}


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'`(.+?)`', r'<code>\1</code>', t)
    return t


def render(lines):
    """목록(들여쓰기 2칸 단위)·표·문단을 HTML로."""
    out, i = [], 0
    lines = [l.rstrip() for l in lines]
    while i < len(lines):
        l = lines[i]
        if not l.strip():
            i += 1
            continue
        s = l.lstrip()
        if s.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].lstrip().startswith('|'):
                rows.append(lines[i].strip())
                i += 1
            cells = [[c.strip() for c in r.strip('|').split('|')] for r in rows]
            body = [r for r in cells if not all(re.fullmatch(r':?-+:?', c) for c in r)]
            h = '<div class="tbl"><table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in body[0]) + '</tr></thead><tbody>'
            h += ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in body[1:])
            out.append(h + '</tbody></table></div>')
            continue
        if s.startswith('- '):
            items, base = [], len(l) - len(s)
            while i < len(lines) and lines[i].strip():
                cur = lines[i]
                ind = len(cur) - len(cur.lstrip())
                if ind == base and cur.lstrip().startswith('- '):
                    items.append([cur.lstrip()[2:], []])
                elif ind > base and items:
                    items[-1][1].append(cur[base + 2:] if len(cur) > base + 2 else cur.strip())
                else:
                    break
                i += 1
            out.append('<ul>' + ''.join(f'<li>{inline(t)}{render(sub) if sub else ""}</li>' for t, sub in items) + '</ul>')
            continue
        if s.startswith('> '):
            out.append(f'<p class="note">{inline(s[2:])}</p>')
            i += 1
            continue
        out.append(f'<p>{inline(s)}</p>')
        i += 1
    return ''.join(out)


def parse(md):
    text = md.split('\n# 후순위')[0]
    official = ''
    m = re.search(r'^## 0\.[^\n]*\n(.*?)(?=^---|\Z)', text, re.S | re.M)
    if m:
        official = render(m.group(1).split('\n'))
    sections = []
    for sm in re.finditer(r'^## (\d+)\. ([^\n]*)\n(.*?)(?=^## \d+\. |\Z)', text, re.S | re.M):
        no = int(sm.group(1))
        if not 1 <= no <= MAX_SECTION:
            continue
        title = re.sub(r'\s*\(약[^)]*\)\s*$', '', sm.group(2)).strip()
        body = sm.group(3)
        intro = body.split('\n### ')[0]
        sec = {'no': no, 'title': title, 'note': render([l for l in intro.split('\n') if l.startswith('> ')]), 'questions': []}
        for qm in re.finditer(r'^### (\d+-\d+)\. ([^\n]*)\n(.*?)(?=^### |^---|\Z)', body, re.S | re.M):
            qid, qtitle = qm.group(1), qm.group(2).strip()
            disputed = '⚠️' in qtitle
            qtitle = qtitle.replace('⚠️', '').strip()
            qtitle = re.sub(r'\s*\(약[^)]*\)\s*$', '', qtitle)
            tiers, cur = {}, None
            for line in qm.group(3).split('\n'):
                tm = TIER_RE.match(line)
                if tm:
                    cur = TIER_KEY[tm.group(1)]
                    tiers[cur] = [tm.group(2)] if tm.group(2).strip() else []
                elif cur and (line.startswith('  ') or not line.strip()):
                    tiers[cur].append(line[2:] if line.startswith('  ') else '')
            q = {'id': qid, 'title': qtitle, 'disputed': disputed}
            for k in ('official', 'inquiry', 'member'):
                raw = [l for l in tiers.get(k, [])]
                joined = '\n'.join(raw).strip()
                q[k] = '' if joined in ('', '—', '확인 안 됨') else render(raw)
            sec['questions'].append(q)
        sections.append(sec)
    return {'built': datetime.now().strftime('%Y-%m-%d %H:%M'), 'official': official, 'sections': sections}


def main():
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else 'contract-faq-data.js'
    data = parse(open(src, encoding='utf-8').read())
    n = sum(len(s['questions']) for s in data['sections'])
    with open(dst, 'w', encoding='utf-8') as f:
        f.write('// tools/build_contract_faq.py 로 생성 — 직접 고치지 말 것\nwindow.CONTRACT_FAQ = ')
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write(';\n')
    print(f'{dst}: 분류 {len(data["sections"])}개, 질문 {n}개')


if __name__ == '__main__':
    main()
