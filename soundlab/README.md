# soundlab · 보라다방 음향 공동 개발 기록

GPT와 Claude가 함께 쓰는 기록이다. 채팅 기억이 아니라 이 폴더가 기준이다.
Starter 원본: `BORA_collaboration_starter_2026-11-13.zip` (GPT 작성, SHA256 13개 일치 확인) → 이 저장소에 맞게 고쳐 넣음.

## 위치와 배포

- 브랜치 `sound-lab`. `main`은 운영·자동 배포이므로 실험을 넣지 않는다.
- 저장소는 **공개**다(2026-11-13 사용자 결정, D-005). 이 폴더의 문서도 누구나 볼 수 있다.
- `firebase.json`의 ignore에 `soundlab/**`가 있어 사이트에는 올라가지 않는다(이 브랜치가 main에 합쳐질 때부터 적용).

## 폴더

| 폴더 | 내용 |
|---|---|
| `docs/` | CHARTER, CURRENT_STATE, DECISIONS, HANDOFF, REVIEW_PROTOCOL, TEST_GATE, CLAIMS_REGISTER |
| `templates/` | 제안서·검토 요청·GPT 새 채팅 시작 문구 |
| `proposals/` | P-번호_제목.md, 한 건 한 파일 |
| `reviews/` | R-번호_제목.md, 첫 줄에 대상 커밋과 대상 제안 번호 |
| `spec/` | audio_manifest 스키마, mix_plan 계약 |
| `tools/` | 측정·렌더 스크립트 |
| `results/<커밋>/` | 측정 JSON·CSV·로그. WAV는 해시만 남긴다 |
| `evidence/` | 보고서, 논문 메모, 상대 AI의 독립 측정 원본 |

## 해시가 바뀐 적이 있음

2026-11-13 커밋 기록을 다시 써서 그 전 해시가 모두 바뀌었다. 예전 보고서의 해시는 `docs/HASH_MAP.md`로 바꿔 읽는다.

## 진실의 우선순위

원본 코드·신호 실측 > 재현 가능한 시험 > 연구 원문의 실험 조건 > 전문가 검토 > AI 의견

## GPT가 최신 코드를 보는 법

1. 공개 저장소 주소: https://github.com/ysangyn/bora_hp/tree/sound-lab
2. 못 읽으면 Claude가 만든 커밋 스냅샷 ZIP(파일 이름에 커밋 해시, SHA256 목록 포함)
3. 모든 검토의 첫 줄에 대상 커밋 해시를 적는다. 다르면 먼저 맞춘다.

푸시는 Claude가 한다. GPT의 결과물은 사용자가 전달하면 Claude가 `reviews/`·`evidence/`에 그대로 넣고 커밋 해시를 알린다.
