# 이 저장소에서 일하는 AI에게 (ChatGPT·Codex 등)

이 저장소는 운영 중인 사이트 **보라다방**(https://bora-hp.web.app)이다. `main`에 푸시하면 GitHub Actions가 바로 배포한다.

## 먼저 읽을 것

음향 작업이면 `soundlab/README.md` → `soundlab/docs/HANDOFF.md` → `soundlab/docs/DECISIONS.md` 순서로 읽고, 작업 대상 커밋 해시를 확인한다.

## 규칙

- 실험은 `sound-lab` 브랜치에서 한다. `main` 변경과 배포는 사용자 승인 후에만.
- 구현한 것과 효과가 검증된 것을 구분한다. 하지 않은 시험은 NOT_RUN으로 적는다. 측정하지 않은 수치를 만들지 않는다.
- Claude가 만든 구현도, 내가 만든 제안도 상대 AI의 독립 검토를 거친다. 두 AI의 합의는 증거가 아니다.
- 작업이 끝나면 `HANDOFF.md`, `CLAIMS_REGISTER.csv` 갱신안과 사용자 승인이 필요한 결정을 남긴다.
- 사이트 문구 원칙: 의학 용어와 효능 주장을 쓰지 않는다. 주인의 실명을 쓰지 않는다(활동명 어른아이). 광고 없음.
- 비밀정보(서비스 계정 키 등)는 저장소에 넣지 않는다.
