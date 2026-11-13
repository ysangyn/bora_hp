# soundlab · 보라다방 음향 공동 개발 기록

GPT와 Claude가 함께 쓰는 기록이다. 채팅 기억이 아니라 이 폴더가 기준이다.
Starter 원본: `BORA_collaboration_starter_2026-11-13.zip` (GPT 작성, SHA256 13개 일치 확인) → 이 저장소에 맞게 고쳐 넣음.

## 위치와 배포

- 브랜치 `sound-lab`. `main`은 운영·자동 배포이므로 실험을 넣지 않는다.
- 저장소는 **공개**다(2026-11-13 사용자 결정, D-005). 이 폴더의 문서도 누구나 볼 수 있다.
- `firebase.json`의 ignore에 `soundlab/**`가 있어 사이트에는 올라가지 않는다(이 브랜치가 main에 합쳐질 때부터 적용).

## 폴더와 주인

| 폴더 | 주인 | 내용 |
|---|---|---|
| `engine/` | **GPT** | 배합 엔진 코드·테스트·카탈로그·G 문서. Claude는 여기를 직접 고치지 않고 제안(E·CE 번호)만 한다 |
| `verify/` | **Claude** | 독립 검증 스크립트 (반례, 변이 시험, WAV 측정, 합성음 캡처). GPT도 고치지 않고 제안만 |
| `inbox/gpt/<날짜>_<이름>/` | Claude가 기록 | 받은 GPT 패키지의 ZIP·파일별 SHA256 (`RECEIPT.md`). 반영본과 원본이 같은지 대조용 |
| `results/<R번호 또는 커밋>/` | 만든 쪽 | 측정 JSON·로그. WAV는 해시만 |
| `reviews/` | 양쪽 | `R-…` Claude 검토, `G-…` GPT 검토. 첫 줄에 대상 커밋·패키지 해시 |
| `docs/` | 양쪽 | CURRENT_STATE, DECISIONS(사용자 승인만), CLAIMS_REGISTER, HANDOFF |
| `tools/`, `spec/`, `proposals/`, `templates/`, `evidence/` | 양쪽 | 공용 측정 도구, 규격, 제안서, 양식, 근거 자료 |

## 주고받는 순서

1. **GPT → 저장소**: GPT가 패키지(ZIP)를 만들면 사용자가 Claude에게 전달 → Claude가 `inbox/`에 해시 기록, `engine/`에 그대로 반영, 테스트 재실행, `R-…` 검토 작성, 커밋 해시를 사용자에게 알림.
2. **저장소 → GPT**: 사용자는 커밋 해시 한 줄을 GPT에 전달. GPT는 https://github.com/ysangyn/bora_hp/tree/sound-lab 을 읽음 (못 읽으면 Claude가 그 커밋 스냅샷 ZIP을 만듦).
3. **같은 시험 결과**: `sound-lab`에 푸시되면 GitHub Actions `soundlab 검사`가 엔진 테스트·반례·변이 시험을 돌리고 로그를 산출물로 남김. 두 AI 모두 같은 실행 결과를 본다.
4. GPT 패키지에는 `README.md`에 **기준 커밋**과 바뀐 파일 목록을 적어 달라. 기준 커밋이 다르면 Claude가 먼저 맞춘다.
5. 운영 반영(`main`)은 사용자 승인 뒤에만. `sound-lab`은 배포되지 않는다.

## 해시가 바뀐 적이 있음

2026-11-13 커밋 기록을 다시 써서 그 전 해시가 모두 바뀌었다. 예전 보고서의 해시는 `docs/HASH_MAP.md`로 바꿔 읽는다.

## 진실의 우선순위

원본 코드·신호 실측 > 재현 가능한 시험 > 연구 원문의 실험 조건 > 전문가 검토 > AI 의견

## GPT가 최신 코드를 보는 법

1. 공개 저장소 주소: https://github.com/ysangyn/bora_hp/tree/sound-lab
2. 못 읽으면 Claude가 만든 커밋 스냅샷 ZIP(파일 이름에 커밋 해시, SHA256 목록 포함)
3. 모든 검토의 첫 줄에 대상 커밋 해시를 적는다. 다르면 먼저 맞춘다.

푸시는 Claude가 한다. GPT의 결과물은 사용자가 전달하면 Claude가 `reviews/`·`evidence/`에 그대로 넣고 커밋 해시를 알린다.
